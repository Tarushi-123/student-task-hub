import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSession, clearSession, getTasks, addTask, updateTask, deleteTask,
  getExams, getTimetable, Task, Exam, TimetableEntry,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import TaskCard from "@/components/TaskCard";
import TaskDialog from "@/components/TaskDialog";
import StatsBar from "@/components/StatsBar";
import ExamSection from "@/components/ExamSection";
import TimetableSection from "@/components/TimetableSection";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, LogOut, Plus, Search, AlertCircle, RefreshCw } from "lucide-react";

type Filter = "all" | "completed" | "pending";
type Sort = "deadline" | "priority";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("deadline");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const loadAll = useCallback(() => {
    if (!user) return;
    setTasks(getTasks(user.id));
    setExams(getExams(user.id));
    setTimetable(getTimetable(user.id));
  }, [user]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000); // 60s auto-refresh
    return () => clearInterval(interval);
  }, [loadAll]);

  // Urgent alerts on mount
  useEffect(() => {
    if (!user) return;
    const urgentTasks = tasks.filter((t) => t.daysLeft <= 2 && t.status === "pending");
    const urgentExams = exams.filter((e) => {
      const days = Math.ceil((new Date(e.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 3 && days >= 0;
    });
    const total = urgentTasks.length + urgentExams.length;
    if (total > 0) {
      toast({
        title: "⚠️ Upcoming Deadlines!",
        description: `${urgentTasks.length} urgent task(s), ${urgentExams.length} exam(s) coming soon!`,
        variant: "destructive",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    toast({ title: "Refreshing data..." });
    setTimeout(() => {
      loadAll();
      setRefreshing(false);
    }, 500);
  };

  const displayedTasks = useMemo(() => {
    let result = [...tasks];
    if (filter === "completed") result = result.filter((t) => t.status === "completed");
    if (filter === "pending") result = result.filter((t) => t.status === "pending");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    }
    if (sort === "deadline") result.sort((a, b) => a.daysLeft - b.daysLeft);
    if (sort === "priority") {
      const order = { High: 0, Medium: 1, Low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return result;
  }, [tasks, filter, search, sort]);

  if (!user) return null;

  const handleAdd = (data: { title: string; subject: string; daysLeft: number; type: "Online" | "Offline"; subtaskNames: string[] }) => {
    addTask(user.id, data.title, data.subject, data.daysLeft, data.type, data.subtaskNames);
    loadAll();
    toast({ title: "Task added!" });
  };

  const handleEdit = (data: { title: string; subject: string; daysLeft: number; type: "Online" | "Offline"; subtaskNames: string[] }) => {
    if (editingTask) {
      updateTask(user.id, editingTask.id, { title: data.title, subject: data.subject, daysLeft: data.daysLeft, type: data.type });
      loadAll();
      toast({ title: "Task updated!" });
    }
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    deleteTask(user.id, id);
    loadAll();
    toast({ title: "Task deleted" });
  };

  const handleToggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      updateTask(user.id, id, { status: task.status === "completed" ? "pending" : "completed" });
      loadAll();
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="gradient-primary sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary-foreground">StudyPro</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing} className="text-primary-foreground hover:bg-primary-foreground/10">
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <span className="text-primary-foreground/80 text-sm hidden sm:block">Hi, {user.name}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Welcome */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name} 👋</h1>
          <p className="text-muted-foreground">Your academic overview</p>
        </div>

        <StatsBar tasks={tasks} />

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Sort: Deadline</SelectItem>
                  <SelectItem value="priority">Sort: Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </div>

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
                    userId={user.id}
                    onEdit={(t) => { setEditingTask(t); setDialogOpen(true); }}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                    onSubtaskChange={loadAll}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <ExamSection exams={exams} userId={user.id} onRefresh={loadAll} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <CalendarView tasks={tasks} exams={exams} />
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            <TimetableSection entries={timetable} userId={user.id} onRefresh={loadAll} />
          </TabsContent>
        </Tabs>
      </main>

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
