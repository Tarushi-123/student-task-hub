import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Task } from "@/lib/store";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; subject: string; daysLeft: number }) => void;
  task?: Task | null;
}

const TaskDialog = ({ open, onClose, onSave, task }: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [daysLeft, setDaysLeft] = useState(7);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSubject(task.subject);
      setDaysLeft(task.daysLeft);
    } else {
      setTitle("");
      setSubject("");
      setDaysLeft(7);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;
    onSave({ title: title.trim(), subject: subject.trim(), daysLeft });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
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
          <div className="space-y-2">
            <Label htmlFor="days">Days Left</Label>
            <Input id="days" type="number" min={0} value={daysLeft} onChange={(e) => setDaysLeft(Number(e.target.value))} />
          </div>
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
