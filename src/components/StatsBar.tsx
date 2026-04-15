import { Task } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, ListTodo } from "lucide-react";

const StatsBar = ({ tasks }: { tasks: Task[] }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const stats = [
    { label: "Total", value: total, icon: ListTodo, color: "text-primary" },
    { label: "Completed", value: completed, icon: CheckCircle, color: "text-priority-low" },
    { label: "Pending", value: pending, icon: Clock, color: "text-priority-medium" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 shadow-card text-center border border-border">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl p-4 shadow-card border border-border">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-semibold text-card-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>
    </div>
  );
};

export default StatsBar;
