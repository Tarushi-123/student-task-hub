import { useState } from "react";
import { TimetableEntry } from "@/lib/store";
import { TimetableEntry as TimetableEntryClass } from "@/lib/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarDays } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TimetableSectionProps {
  entries: TimetableEntry[];
  userId: string;
  onRefresh: () => void;
}

const TimetableSection = ({ entries, userId, onRefresh }: TimetableSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [day, setDay] = useState("Mon");
  const [timeSlot, setTimeSlot] = useState("");
  const [subject, setSubject] = useState("");

  // Group entries by day
  const grouped: Record<string, TimetableEntry[]> = {};
  DAYS.forEach((d) => { grouped[d] = []; });
  entries.forEach((e) => {
    if (grouped[e.day]) grouped[e.day].push(e);
    else grouped[e.day] = [e];
  });
  // Sort each day by time
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeSlot.trim() || !subject.trim()) return;
    // Use TimetableEntry.addEntry() per class diagram
    TimetableEntryClass.addEntry(userId, day, timeSlot.trim(), subject.trim());
    setTimeSlot("");
    setSubject("");
    setDialogOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    // Use TimetableEntry instance .delete() per class diagram
    const target = entries.find((e) => e.id === id);
    if (target) new TimetableEntryClass(target).delete();
    onRefresh();
  };

  const hasEntries = entries.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Class Timetable
        </h2>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Add Class
        </Button>
      </div>

      {!hasEntries ? (
        <p className="text-muted-foreground text-sm text-center py-6">No classes added yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {DAYS.map((d) => (
                  <th key={d} className="bg-muted text-muted-foreground font-semibold px-3 py-2 text-center border border-border first:rounded-tl-lg last:rounded-tr-lg">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {DAYS.map((d) => (
                  <td key={d} className="border border-border p-2 align-top min-w-[120px] bg-card">
                    {grouped[d].length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        {grouped[d].map((entry) => (
                          <div key={entry.id} className="bg-primary/5 rounded-lg px-2 py-1.5 group relative">
                            <p className="font-medium text-card-foreground text-xs">{entry.subject}</p>
                            <p className="text-muted-foreground text-[11px]">{entry.timeSlot}</p>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Input placeholder="e.g. 9:00 AM - 10:00 AM" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
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

export default TimetableSection;
