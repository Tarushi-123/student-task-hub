// Local storage-based store for users, tasks, subtasks, exams, and timetable

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
  type: "Online" | "Offline";
  progress: number;
  userId: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  subject: string;
  examDate: string;
  userId: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  userId: string;
}

/** Calculate days left from a deadline date string */
export function calcDaysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Priority auto-assignment based on days left */
export function getPriority(days: number): "High" | "Medium" | "Low" {
  if (days <= 2) return "High";
  if (days <= 5) return "Medium";
  return "Low";
}

// ---- User operations ----
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem("studypro_users") || "[]");
}

function saveUsers(users: User[]) {
  localStorage.setItem("studypro_users", JSON.stringify(users));
}

export function registerUser(name: string, email: string, password: string): User | string {
  const users = getUsers();
  if (users.find((u) => u.email === email)) return "Email already registered";
  const user: User = { id: crypto.randomUUID(), name, email, password };
  users.push(user);
  saveUsers(users);
  return user;
}

export function loginUser(email: string, password: string): User | string {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return "Invalid email or password";
  return user;
}

// ---- Session ----
export function setSession(user: User) {
  localStorage.setItem("studypro_session", JSON.stringify(user));
}

export function getSession(): User | null {
  const data = localStorage.getItem("studypro_session");
  return data ? JSON.parse(data) : null;
}

export function clearSession() {
  localStorage.removeItem("studypro_session");
}

// ---- Task operations ----
function taskKey(userId: string) {
  return `studypro_tasks_${userId}`;
}

export function getTasks(userId: string): Task[] {
  return JSON.parse(localStorage.getItem(taskKey(userId)) || "[]");
}

function saveTasks(userId: string, tasks: Task[]) {
  localStorage.setItem(taskKey(userId), JSON.stringify(tasks));
}

export function addTask(
  userId: string,
  title: string,
  subject: string,
  deadline: string,
  type: "Online" | "Offline",
  subtaskNames: string[]
): Task {
  const tasks = getTasks(userId);
  const taskId = crypto.randomUUID();
  const daysLeft = calcDaysLeft(deadline);
  const task: Task = {
    id: taskId,
    title,
    subject,
    deadline,
    priority: getPriority(daysLeft),
    status: "pending",
    type,
    progress: 0,
    userId,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  saveTasks(userId, tasks);

  if (subtaskNames.length > 0) {
    const subtasks: Subtask[] = subtaskNames.map((name) => ({
      id: crypto.randomUUID(),
      taskId,
      name,
      completed: false,
    }));
    saveSubtasks(taskId, subtasks);
  }

  return task;
}

export function updateTask(
  userId: string,
  taskId: string,
  updates: Partial<Pick<Task, "title" | "subject" | "deadline" | "status" | "type" | "progress">>
) {
  const tasks = getTasks(userId);
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;
  if (updates.deadline !== undefined) {
    const daysLeft = calcDaysLeft(updates.deadline);
    (updates as any).priority = getPriority(daysLeft);
  }
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(userId, tasks);
  return tasks[idx];
}

export function deleteTask(userId: string, taskId: string) {
  const tasks = getTasks(userId).filter((t) => t.id !== taskId);
  saveTasks(userId, tasks);
  localStorage.removeItem(`studypro_subtasks_${taskId}`);
}

// ---- Subtask operations ----
export function getSubtasks(taskId: string): Subtask[] {
  return JSON.parse(localStorage.getItem(`studypro_subtasks_${taskId}`) || "[]");
}

function saveSubtasks(taskId: string, subtasks: Subtask[]) {
  localStorage.setItem(`studypro_subtasks_${taskId}`, JSON.stringify(subtasks));
}

export function addSubtask(taskId: string, name: string): Subtask {
  const subtasks = getSubtasks(taskId);
  const sub: Subtask = { id: crypto.randomUUID(), taskId, name, completed: false };
  subtasks.push(sub);
  saveSubtasks(taskId, subtasks);
  return sub;
}

export function updateSubtaskName(taskId: string, subtaskId: string, name: string) {
  const subtasks = getSubtasks(taskId);
  const idx = subtasks.findIndex((s) => s.id === subtaskId);
  if (idx !== -1) subtasks[idx].name = name;
  saveSubtasks(taskId, subtasks);
  return subtasks;
}

export function toggleSubtask(taskId: string, subtaskId: string): Subtask[] {
  const subtasks = getSubtasks(taskId);
  const idx = subtasks.findIndex((s) => s.id === subtaskId);
  if (idx !== -1) subtasks[idx].completed = !subtasks[idx].completed;
  saveSubtasks(taskId, subtasks);
  return subtasks;
}

export function deleteSubtask(taskId: string, subtaskId: string) {
  const subtasks = getSubtasks(taskId).filter((s) => s.id !== subtaskId);
  saveSubtasks(taskId, subtasks);
  return subtasks;
}

/** Recalculate task progress based on subtasks, auto-complete if 100% */
export function recalcProgress(userId: string, taskId: string) {
  const subtasks = getSubtasks(taskId);
  if (subtasks.length === 0) return;
  const done = subtasks.filter((s) => s.completed).length;
  const progress = Math.round((done / subtasks.length) * 100);
  const status = progress === 100 ? "completed" : "pending";
  updateTask(userId, taskId, { progress, status });
}

// ---- Exam operations ----
function examKey(userId: string) {
  return `studypro_exams_${userId}`;
}

export function getExams(userId: string): Exam[] {
  return JSON.parse(localStorage.getItem(examKey(userId)) || "[]");
}

function saveExams(userId: string, exams: Exam[]) {
  localStorage.setItem(examKey(userId), JSON.stringify(exams));
}

export function addExam(userId: string, subject: string, examDate: string): Exam {
  const exams = getExams(userId);
  const exam: Exam = { id: crypto.randomUUID(), subject, examDate, userId };
  exams.push(exam);
  saveExams(userId, exams);
  return exam;
}

export function deleteExam(userId: string, examId: string) {
  const exams = getExams(userId).filter((e) => e.id !== examId);
  saveExams(userId, exams);
}

// ---- Timetable operations ----
function ttKey(userId: string) {
  return `studypro_timetable_${userId}`;
}

export function getTimetable(userId: string): TimetableEntry[] {
  return JSON.parse(localStorage.getItem(ttKey(userId)) || "[]");
}

function saveTimetable(userId: string, entries: TimetableEntry[]) {
  localStorage.setItem(ttKey(userId), JSON.stringify(entries));
}

export function addTimetableEntry(userId: string, day: string, timeSlot: string, subject: string): TimetableEntry {
  const entries = getTimetable(userId);
  const entry: TimetableEntry = { id: crypto.randomUUID(), day, timeSlot, subject, userId };
  entries.push(entry);
  saveTimetable(userId, entries);
  return entry;
}

export function deleteTimetableEntry(userId: string, entryId: string) {
  const entries = getTimetable(userId).filter((e) => e.id !== entryId);
  saveTimetable(userId, entries);
}
