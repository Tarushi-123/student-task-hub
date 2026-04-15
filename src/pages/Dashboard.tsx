import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession, getTasks, addTask, updateTask, deleteTask, Task } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import TaskCard from "@/components/TaskCard";
import TaskDialog from "@/components/TaskDialog";
import StatsBar from "@/components/StatsBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, LogOut, Plus, Search, AlertCircle } from "lucide-react";

type Filter = "all" | "completed" | "pending";
type Sort = "deadline" | "priority";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("deadline");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Load tasks and auto-refresh every 10 seconds
  const loadTasks = useCallback(() => {
    if (user) setTasks(getTasks(user.id));
  }, [user]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 10000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Show urgent task alert on load
  useEffect(() => {
    const urgent = tasks.filter((t) => t.daysLeft <= 2 && t.status === "pending");
    if (urgent.length > 0) {
      toast({
        title: "⚠️ Urgent Tasks!",
        description: `${urgent.length} task${urgent.length > 1 ? "s" : ""} due within 2 days!`,
        variant: "destructive",
      });
    }
  }, []); // Only on mount

  // Filtered and sorted tasks
  const displayedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter
    if (filter === "completed") result = result.filter((t) => t.status === "completed");
    if (filter === "pending") result = result.filter((t) => t.status === "pending");

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    }

    // Sort
    if (sort === "deadline") result.sort((a, b) => a.daysLeft - b.daysLeft);
    if (sort === "priority") {
      const order = { High: 0, Medium: 1, Low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }

    return result;
  }, [tasks, filter, search, sort]);

  if (!user) return null;

  const handleAdd = (data: { title: string; subject: string; daysLeft: number }) => {
    addTask(user.id, data.title, data.subject, data.daysLeft);
    loadTasks();
    toast({ title: "Task added!" });
  };

  const handleEdit = (data: { title: string; subject: string; daysLeft: number }) => {
    if (editingTask) {
      updateTask(user.id, editingTask.id, data);
      loadTasks();
      toast({ title: "Task updated!" });
    }
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    deleteTask(user.id, id);
    loadTasks();
    toast({ title: "Task deleted" });
  };

  const handleToggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      updateTask(user.id, id, { status: task.status === "completed" ? "pending" : "completed" });
      loadTasks();
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="gradient-primary sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary-foreground">StudyPro</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary-foreground/80 text-sm hidden sm:block">Hi, {user.name}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name} 👋</h1>
          <p className="text-muted-foreground">Here's your assignment overview</p>
        </div>

        {/* Stats */}
        <StatsBar tasks={tasks} />

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Sort: Deadline</SelectItem>
              <SelectItem value="priority">Sort: Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="gradient-primary text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Task Grid */}
        {displayedTasks.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No tasks available</h3>
            <p className="text-muted-foreground">Add your first task to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditingTask(t); setDialogOpen(true); }}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null); }}
        onSave={editingTask ? handleEdit : handleAdd}
        task={editingTask}
      />
    </div>
  );
};

export default Dashboard;
