import { Task, Subtask, toggleSubtask, recalcProgress, getSubtasks } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Pencil, Trash2, AlertTriangle, Clock, Monitor, FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface TaskCardProps {
  task: Task;
  userId: string;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onSubtaskChange: () => void;
}

const priorityStyles = {
  High: "bg-priority-high/10 text-priority-high border-priority-high/30",
  Medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/30",
  Low: "bg-priority-low/10 text-priority-low border-priority-low/30",
};

const TaskCard = ({ task, userId, onEdit, onDelete, onToggleComplete, onSubtaskChange }: TaskCardProps) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const isUrgent = task.daysLeft <= 2 && task.status === "pending";
  const isDueToday = task.daysLeft === 0 && task.status === "pending";

  useEffect(() => {
    setSubtasks(getSubtasks(task.id));
  }, [task]);

  const handleToggleSub = (subId: string) => {
    const updated = toggleSubtask(task.id, subId);
    setSubtasks(updated);
    recalcProgress(userId, task.id);
    onSubtaskChange();
  };

  return (
    <div
      className={`group relative bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border ${
        isUrgent ? "border-priority-high/40 ring-1 ring-priority-high/20" : "border-border"
      } ${task.status === "completed" ? "opacity-70" : ""}`}
    >
      {/* Header badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs font-semibold ${priorityStyles[task.priority]}`}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {task.type === "Online" ? <Monitor className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
            {task.type}
          </Badge>
          {isDueToday && (
            <Badge className="bg-priority-high text-primary-foreground text-xs animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" /> Due Today
            </Badge>
          )}
          {isUrgent && !isDueToday && (
            <Badge variant="outline" className="text-xs border-priority-high/40 text-priority-high">
              <Clock className="w-3 h-3 mr-1" /> Urgent
            </Badge>
          )}
          {task.status === "completed" && (
            <Badge className="bg-priority-low/20 text-priority-low text-xs border border-priority-low/30">✓ Done</Badge>
          )}
        </div>
      </div>

      {/* Title & subject */}
      <h3 className={`font-semibold text-card-foreground mb-1 ${task.status === "completed" ? "line-through" : ""}`}>
        {task.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-2">{task.subject}</p>

      {/* Days left */}
      <p className={`text-sm font-medium mb-3 ${
        task.daysLeft <= 2 ? "text-priority-high" : task.daysLeft <= 5 ? "text-priority-medium" : "text-muted-foreground"
      }`}>
        {task.daysLeft === 0 ? "Due today!" : `${task.daysLeft} day${task.daysLeft !== 1 ? "s" : ""} left`}
      </p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-card-foreground">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-2" />
      </div>

      {/* Subtasks checklist */}
      {subtasks.length > 0 && (
        <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
          {subtasks.map((sub) => (
            <label
              key={sub.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
            >
              <Checkbox
                checked={sub.completed}
                onCheckedChange={() => handleToggleSub(sub.id)}
              />
              <span className={sub.completed ? "line-through text-muted-foreground" : "text-card-foreground"}>
                {sub.name}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button size="sm" variant="ghost" onClick={() => onToggleComplete(task.id)} className="text-muted-foreground hover:text-priority-low">
          <Check className="w-4 h-4 mr-1" />
          {task.status === "completed" ? "Undo" : "Complete"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(task)} className="text-muted-foreground hover:text-primary">
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
};

export default TaskCard;
