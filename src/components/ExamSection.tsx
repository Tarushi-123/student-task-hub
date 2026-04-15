import { useState } from "react";
import { Exam, addExam, deleteExam, calcDaysLeft, parseLocalDate, daysLeftLabel } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, AlertTriangle, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExamSectionProps {
  exams: Exam[];
  userId: string;
  onRefresh: () => void;
}

function daysUntil(dateStr: string) {
  return calcDaysLeft(dateStr);
}

const ExamSection = ({ exams, userId, onRefresh }: ExamSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");

  const sorted = [...exams].sort((a, b) => parseLocalDate(a.examDate).getTime() - parseLocalDate(b.examDate).getTime());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !examDate) return;
    addExam(userId, subject.trim(), examDate);
    setSubject("");
    setExamDate("");
    setDialogOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    deleteExam(userId, id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" /> Upcoming Exams
        </h2>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Add Exam
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">No exams scheduled</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((exam, i) => {
            const days = daysUntil(exam.examDate);
            const isUrgent = days <= 3 && days >= 0;
            const isNearest = i === 0;
            return (
              <div
                key={exam.id}
                className={`bg-card rounded-xl p-4 shadow-card border transition-all hover:shadow-card-hover hover:-translate-y-0.5 ${
                  isUrgent ? "border-priority-high/40 ring-1 ring-priority-high/20" : isNearest ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-card-foreground">{exam.subject}</h4>
                    <p className="text-sm text-muted-foreground">{parseLocalDate(exam.examDate).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(exam.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {isUrgent && (
                    <Badge className="bg-priority-high/10 text-priority-high border border-priority-high/30 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {days <= 0 ? "Today!" : `${days} day${days > 1 ? "s" : ""}`}
                    </Badge>
                  )}
                  {!isUrgent && days >= 0 && (
                    <Badge variant="outline" className="text-xs">{days} day{days !== 1 ? "s" : ""} away</Badge>
                  )}
                  {days < 0 && <Badge variant="outline" className="text-xs text-muted-foreground">Passed</Badge>}
                  {isNearest && days >= 0 && <Badge className="bg-primary/10 text-primary border border-primary/30 text-xs">Next</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Exam Date</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamSection;
