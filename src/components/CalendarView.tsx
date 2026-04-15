import { Task, Exam, calcDaysLeft } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  exams: Exam[];
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const CalendarView = ({ tasks, exams }: CalendarViewProps) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const monthName = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

  const eventsMap = useMemo(() => {
    const map: Record<string, { label: string; type: "exam" | "assignment"; urgent: boolean }[]> = {};

    tasks.forEach((t) => {
      const key = t.deadline;
      if (!map[key]) map[key] = [];
      map[key].push({ label: t.subject, type: "assignment", urgent: calcDaysLeft(t.deadline) <= 2 });
    });

    exams.forEach((ex) => {
      const key = ex.examDate;
      if (!map[key]) map[key] = [];
      const days = Math.ceil((new Date(ex.examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      map[key].push({ label: ex.subject, type: "exam", urgent: days <= 3 && days >= 0 });
    });

    return map;
  }, [tasks, exams]);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Calendar
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">{monthName}</span>
          <Button size="sm" variant="ghost" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Exam</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-priority-low inline-block" /> Assignment</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-priority-high inline-block" /> Urgent</span>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-muted text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="bg-card min-h-[70px]" />;
          const date = new Date(year, month, day);
          const key = date.toISOString().split("T")[0];
          const events = eventsMap[key] || [];
          const isToday = isSameDay(date, today);

          return (
            <div key={i} className={`bg-card min-h-[70px] p-1.5 relative ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
              <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : "text-card-foreground"}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 2).map((ev, j) => (
                  <div
                    key={j}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                      ev.urgent ? "bg-priority-high/15 text-priority-high" :
                      ev.type === "exam" ? "bg-primary/10 text-primary" : "bg-priority-low/10 text-priority-low"
                    }`}
                  >
                    {ev.label}
                  </div>
                ))}
                {events.length > 2 && <p className="text-[10px] text-muted-foreground">+{events.length - 2}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
