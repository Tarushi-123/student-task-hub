// OOP class implementation matching the project's class diagram.
// These classes wrap the existing storage functions in `store.ts` so the
// rest of the app keeps working unchanged, while exposing a clean
// object-oriented API (User, Task, Subtask, Exam, TimetableEntry,
// AuthService, CalendarService, ReminderService, DashboardController).

import {
  User as IUser,
  Task as ITask,
  Subtask as ISubtask,
  Exam as IExam,
  TimetableEntry as ITimetableEntry,
  registerUser, loginUser, getSession, setSession, clearSession,
  getTasks, addTask, updateTask, deleteTask,
  getSubtasks, addSubtask, updateSubtaskName, deleteSubtask, toggleSubtask, recalcProgress,
  getExams, addExam, deleteExam,
  getTimetable, addTimetableEntry, deleteTimetableEntry,
  calcDaysLeft, getPriority, parseLocalDate,
} from "./store";

// ---------------- User ----------------
export class User {
  id: string;
  name: string;
  email: string;
  private password: string;

  constructor(data: IUser) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
  }

  static register(name: string, email: string, password: string): User | string {
    const result = registerUser(name, email, password);
    return typeof result === "string" ? result : new User(result);
  }

  static login(email: string, password: string): User | string {
    const result = loginUser(email, password);
    if (typeof result === "string") return result;
    const u = new User(result);
    setSession(result);
    return u;
  }

  logout(): void {
    clearSession();
  }
}

// ---------------- Subtask ----------------
export class Subtask {
  id: string;
  taskId: string;
  subtaskName: string;
  status: boolean;

  constructor(data: ISubtask) {
    this.id = data.id;
    this.taskId = data.taskId;
    this.subtaskName = data.name;
    this.status = data.completed;
  }

  static addSubtask(taskId: string, name: string): Subtask {
    return new Subtask(addSubtask(taskId, name));
  }

  editSubtask(name: string): void {
    updateSubtaskName(this.taskId, this.id, name);
    this.subtaskName = name;
  }

  deleteSubtask(): void {
    deleteSubtask(this.taskId, this.id);
  }

  toggleStatus(): void {
    toggleSubtask(this.taskId, this.id);
    this.status = !this.status;
  }
}

// ---------------- Task ----------------
export class Task {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
  type: "Online" | "Offline";
  progress: number;
  userId: string;
  createdAt: string;

  constructor(data: ITask) {
    this.id = data.id;
    this.title = data.title;
    this.subject = data.subject;
    this.deadline = data.deadline;
    this.priority = data.priority;
    this.status = data.status;
    this.type = data.type;
    this.progress = data.progress;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
  }

  static addTask(
    userId: string,
    title: string,
    subject: string,
    deadline: string,
    type: "Online" | "Offline",
    subtaskNames: string[] = []
  ): Task {
    return new Task(addTask(userId, title, subject, deadline, type, subtaskNames));
  }

  editTask(updates: Partial<Pick<ITask, "title" | "subject" | "deadline" | "status" | "type" | "progress">>): void {
    const updated = updateTask(this.userId, this.id, updates);
    if (updated) Object.assign(this, updated);
  }

  deleteTask(): void {
    deleteTask(this.userId, this.id);
  }

  calculatePriority(): "High" | "Medium" | "Low" {
    return getPriority(this.calculateDaysLeft());
  }

  calculateDaysLeft(): number {
    return calcDaysLeft(this.deadline);
  }

  getSubtasks(): Subtask[] {
    return getSubtasks(this.id).map((s) => new Subtask(s));
  }
}

// ---------------- Exam ----------------
export class Exam {
  id: string;
  subject: string;
  examDate: string;
  userId: string;

  constructor(data: IExam) {
    this.id = data.id;
    this.subject = data.subject;
    this.examDate = data.examDate;
    this.userId = data.userId;
  }

  static addExam(userId: string, subject: string, examDate: string): Exam {
    return new Exam(addExam(userId, subject, examDate));
  }

  static getUpcomingExams(userId: string): Exam[] {
    return getExams(userId)
      .map((e) => new Exam(e))
      .filter((e) => calcDaysLeft(e.examDate) >= 0)
      .sort((a, b) => calcDaysLeft(a.examDate) - calcDaysLeft(b.examDate));
  }

  delete(): void {
    deleteExam(this.userId, this.id);
  }
}

// ---------------- TimetableEntry ----------------
export class TimetableEntry {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  userId: string;

  constructor(data: ITimetableEntry) {
    this.id = data.id;
    this.day = data.day;
    this.timeSlot = data.timeSlot;
    this.subject = data.subject;
    this.userId = data.userId;
  }

  static addEntry(userId: string, day: string, timeSlot: string, subject: string): TimetableEntry {
    return new TimetableEntry(addTimetableEntry(userId, day, timeSlot, subject));
  }

  editEntry(day: string, timeSlot: string, subject: string): void {
    // Simple edit = delete + re-add (no update helper exists in store)
    deleteTimetableEntry(this.userId, this.id);
    const created = addTimetableEntry(this.userId, day, timeSlot, subject);
    Object.assign(this, created);
  }

  delete(): void {
    deleteTimetableEntry(this.userId, this.id);
  }
}

// ---------------- AuthService ----------------
export class AuthService {
  private static _currentUser: User | null = null;

  static get currentUser(): User | null {
    if (this._currentUser) return this._currentUser;
    const session = getSession();
    if (session) this._currentUser = new User(session);
    return this._currentUser;
  }

  static validateLogin(email: string, password: string): boolean {
    const result = User.login(email, password);
    if (typeof result === "string") return false;
    this._currentUser = result;
    return true;
  }

  static register(name: string, email: string, password: string): User | string {
    return User.register(name, email, password);
  }

  static logout(): void {
    clearSession();
    this._currentUser = null;
  }
}

// ---------------- CalendarService ----------------
export interface CalendarEvent {
  date: string;
  label: string;
  type: "exam" | "assignment";
  urgent: boolean;
}

export class CalendarService {
  events: CalendarEvent[] = [];

  mapDeadlines(tasks: Task[] | ITask[]): CalendarEvent[] {
    return tasks.map((t) => ({
      date: t.deadline,
      label: t.subject,
      type: "assignment" as const,
      urgent: calcDaysLeft(t.deadline) <= 2,
    }));
  }

  mapExams(exams: Exam[] | IExam[]): CalendarEvent[] {
    return exams.map((e) => {
      const days = calcDaysLeft(e.examDate);
      return {
        date: e.examDate,
        label: e.subject,
        type: "exam" as const,
        urgent: days <= 3 && days >= 0,
      };
    });
  }

  renderCalendar(tasks: Task[] | ITask[], exams: Exam[] | IExam[]): CalendarEvent[] {
    this.events = [...this.mapDeadlines(tasks), ...this.mapExams(exams)];
    return this.events;
  }
}

// ---------------- ReminderService ----------------
export class ReminderService {
  alertMessage: string = "";

  checkTaskReminder(task: Task | ITask): string {
    const days = calcDaysLeft(task.deadline);
    if (days < 0) return `Overdue: ${task.title}`;
    if (days === 0) return `Due today: ${task.title}`;
    if (days <= 2) return `${task.title} is due in ${days} day(s)`;
    return "";
  }

  checkExamReminder(exam: Exam | IExam): string {
    const days = calcDaysLeft(exam.examDate);
    if (days < 0) return "";
    if (days === 0) return `Exam today: ${exam.subject}`;
    if (days <= 3) return `${exam.subject} exam in ${days} day(s)`;
    return "";
  }
}

// ---------------- DashboardController ----------------
export class DashboardController {
  tasks: Task[] = [];
  exams: Exam[] = [];
  timetable: TimetableEntry[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  loadDashboard(): void {
    this.tasks = getTasks(this.userId).map((t) => new Task(t));
    this.exams = getExams(this.userId).map((e) => new Exam(e));
    this.timetable = getTimetable(this.userId).map((e) => new TimetableEntry(e));
  }

  refreshData(): void {
    this.loadDashboard();
  }
}
