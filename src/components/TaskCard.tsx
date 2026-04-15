import { Task } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2, AlertTriangle, Clock } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const priorityStyles = {
  High: "bg-priority-high/10 text-priority-high border-priority-high/30",
  Medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/30",
  Low: "bg-priority-low/10 text-priority-low border-priority-low/30",
};

const TaskCard = ({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const isUrgent = task.daysLeft <= 2 && task.status === "pending";
  const isDueToday = task.daysLeft === 0 && task.status === "pending";

  return (
    <div
      className={`group relative bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border ${
        isUrgent ? "border-priority-high/40 ring-1 ring-priority-high/20" : "border-border"
      } ${task.status === "completed" ? "opacity-70" : ""}`}
    >
      {/* Priority badge & urgency indicators */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs font-semibold ${priorityStyles[task.priority]}`}>
            {task.priority}
          </Badge>
          {isDueToday && (
            <Badge className="bg-priority-high text-primary-foreground text-xs animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Due Today
            </Badge>
          )}
          {isUrgent && !isDueToday && (
            <Badge variant="outline" className="text-xs border-priority-high/40 text-priority-high">
              <Clock className="w-3 h-3 mr-1" />
              Urgent
            </Badge>
          )}
          {task.status === "completed" && (
            <Badge className="bg-priority-low/20 text-priority-low text-xs border border-priority-low/30">
              ✓ Done
            </Badge>
          )}
        </div>
      </div>

      {/* Title & subject */}
      <h3 className={`font-semibold text-card-foreground mb-1 ${task.status === "completed" ? "line-through" : ""}`}>
        {task.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-3">{task.subject}</p>

      {/* Days left */}
      <p className={`text-sm font-medium ${
        task.daysLeft <= 2 ? "text-priority-high" : task.daysLeft <= 5 ? "text-priority-medium" : "text-muted-foreground"
      }`}>
        {task.daysLeft === 0 ? "Due today!" : `${task.daysLeft} day${task.daysLeft !== 1 ? "s" : ""} left`}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleComplete(task.id)}
          className="text-muted-foreground hover:text-priority-low"
        >
          <Check className="w-4 h-4 mr-1" />
          {task.status === "completed" ? "Undo" : "Complete"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(task)} className="text-muted-foreground hover:text-primary">
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TaskCard;
