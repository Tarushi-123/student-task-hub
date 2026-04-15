import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/lib/store";
import { Plus, X } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; subject: string; daysLeft: number; type: "Online" | "Offline"; subtaskNames: string[] }) => void;
  task?: Task | null;
}

const TaskDialog = ({ open, onClose, onSave, task }: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [daysLeft, setDaysLeft] = useState(7);
  const [type, setType] = useState<"Online" | "Offline">("Online");
  const [subtaskNames, setSubtaskNames] = useState<string[]>([]);
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSubject(task.subject);
      setDaysLeft(task.daysLeft);
      setType(task.type);
      setSubtaskNames([]);
    } else {
      setTitle("");
      setSubject("");
      setDaysLeft(7);
      setType("Online");
      setSubtaskNames([]);
    }
    setNewSub("");
  }, [task, open]);

  const addSub = () => {
    if (newSub.trim()) {
      setSubtaskNames([...subtaskNames, newSub.trim()]);
      setNewSub("");
    }
  };

  const removeSub = (idx: number) => {
    setSubtaskNames(subtaskNames.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;
    onSave({ title: title.trim(), subject: subject.trim(), daysLeft, type, subtaskNames });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Assignment name" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="days">Days Left</Label>
              <Input id="days" type="number" min={0} value={daysLeft} onChange={(e) => setDaysLeft(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "Online" | "Offline")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtasks section — only for new tasks */}
          {!task && (
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Research topic"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }}
                />
                <Button type="button" size="sm" variant="outline" onClick={addSub}><Plus className="w-4 h-4" /></Button>
              </div>
              {subtaskNames.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {subtaskNames.map((s, i) => (
                    <li key={i} className="flex items-center justify-between bg-muted rounded px-3 py-1.5 text-sm">
                      <span>{s}</span>
                      <button type="button" onClick={() => removeSub(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90">
              {task ? "Update" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
