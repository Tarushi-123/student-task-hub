// Local storage-based store for users and tasks

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  daysLeft: number;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed";
  userId: string;
  createdAt: string;
}

// Priority auto-assignment based on days left
export function getPriority(days: number): "High" | "Medium" | "Low" {
  if (days <= 2) return "High";
  if (days <= 5) return "Medium";
  return "Low";
}

// User operations
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

// Session
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

// Task operations
function getKey(userId: string) {
  return `studypro_tasks_${userId}`;
}

export function getTasks(userId: string): Task[] {
  return JSON.parse(localStorage.getItem(getKey(userId)) || "[]");
}

function saveTasks(userId: string, tasks: Task[]) {
  localStorage.setItem(getKey(userId), JSON.stringify(tasks));
}

export function addTask(userId: string, title: string, subject: string, daysLeft: number): Task {
  const tasks = getTasks(userId);
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    subject,
    daysLeft,
    priority: getPriority(daysLeft),
    status: "pending",
    userId,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  saveTasks(userId, tasks);
  return task;
}

export function updateTask(userId: string, taskId: string, updates: Partial<Pick<Task, "title" | "subject" | "daysLeft" | "status">>) {
  const tasks = getTasks(userId);
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;
  if (updates.daysLeft !== undefined) {
    updates = { ...updates } as any;
    (updates as any).priority = getPriority(updates.daysLeft);
  }
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(userId, tasks);
  return tasks[idx];
}

export function deleteTask(userId: string, taskId: string) {
  const tasks = getTasks(userId).filter((t) => t.id !== taskId);
  saveTasks(userId, tasks);
}
