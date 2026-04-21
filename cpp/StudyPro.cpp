// =====================================================================
// StudyPro - Student Productivity Planner (Console Version)
// Mirrors the project's UML class diagram:
//   User, Task, Subtask, Exam, TimetableEntry,
//   AuthService, CalendarService, ReminderService, DashboardController
//
// Build:  g++ -std=c++17 StudyPro.cpp -o studypro
// Run  :  ./studypro       (Linux/Mac)   |   studypro.exe   (Windows)
//
// In VS Code: open this file -> Terminal -> Run the build & run commands.
// =====================================================================

#include <iostream>
#include <string>
#include <vector>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <limits>

using namespace std;

// ---------- Date helpers (avoid timezone shifting) ----------
struct LocalDate {
    int y, m, d;
};

// Parse "YYYY-MM-DD" as a LOCAL date (no timezone shift)
LocalDate parseDate(const string& s) {
    LocalDate ld{0, 0, 0};
    if (s.size() < 10) return ld;
    ld.y = stoi(s.substr(0, 4));
    ld.m = stoi(s.substr(5, 2));
    ld.d = stoi(s.substr(8, 2));
    return ld;
}

// Convert LocalDate -> time_t at local midnight
time_t toTime(const LocalDate& ld) {
    tm t{};
    t.tm_year = ld.y - 1900;
    t.tm_mon  = ld.m - 1;
    t.tm_mday = ld.d;
    t.tm_hour = 0; t.tm_min = 0; t.tm_sec = 0;
    return mktime(&t);
}

LocalDate today() {
    time_t now = time(nullptr);
    tm* lt = localtime(&now);
    return { lt->tm_year + 1900, lt->tm_mon + 1, lt->tm_mday };
}

// Days left between today and deadline (normalised to midnight)
int calcDaysLeft(const string& deadline) {
    if (deadline.empty()) return INT32_MAX;
    LocalDate d = parseDate(deadline);
    LocalDate t = today();
    double diff = difftime(toTime(d), toTime(t));
    return (int)(diff / (60 * 60 * 24));
}

string daysLeftLabel(const string& deadline) {
    int days = calcDaysLeft(deadline);
    if (days < 0)  return "Overdue";
    if (days == 0) return "Due Today";
    if (days == 1) return "1 day left";
    return to_string(days) + " days left";
}

// ---------- Subtask ----------
class Subtask {
public:
    int id;
    int taskId;
    string subtaskName;
    bool status; // true = completed

    Subtask(int id_, int taskId_, string name_)
        : id(id_), taskId(taskId_), subtaskName(std::move(name_)), status(false) {}

    void editSubtask(const string& newName) { subtaskName = newName; }
    void toggleStatus()                     { status = !status; }
};

// ---------- Task ----------
class Task {
public:
    int id;
    string title;
    string subject;
    string deadline;     // YYYY-MM-DD
    string priority;     // High / Medium / Low
    string status;       // pending / completed
    string type;         // Online / Offline
    int progress;        // 0..100
    int userId;
    vector<Subtask> subtasks;

    Task(int id_, string title_, string subject_, string deadline_,
         string type_, int userId_)
        : id(id_), title(std::move(title_)), subject(std::move(subject_)),
          deadline(std::move(deadline_)), status("pending"),
          type(std::move(type_)), progress(0), userId(userId_) {
        priority = calculatePriority();
    }

    string calculatePriority() const {
        int days = calcDaysLeft(deadline);
        if (days <= 2) return "High";
        if (days <= 5) return "Medium";
        return "Low";
    }

    int calculateDaysLeft() const { return calcDaysLeft(deadline); }

    // Recalculate progress from subtask completion
    void recalcProgress() {
        if (subtasks.empty()) { progress = 0; return; }
        int done = 0;
        for (auto& s : subtasks) if (s.status) done++;
        progress = (done * 100) / (int)subtasks.size();
        status = (progress == 100) ? "completed" : "pending";
    }

    void editTask(const string& newTitle, const string& newSubject,
                  const string& newDeadline, const string& newType) {
        title = newTitle; subject = newSubject;
        deadline = newDeadline; type = newType;
        priority = calculatePriority();
    }

    void print() const {
        cout << "  [" << id << "] " << title << " (" << subject << ")\n"
             << "      Deadline: " << deadline
             << "  | " << daysLeftLabel(deadline)
             << "  | Priority: " << priority
             << "  | Type: " << type
             << "  | Status: " << status
             << "  | Progress: " << progress << "%\n";
        if (!subtasks.empty()) {
            cout << "      Subtasks:\n";
            for (auto& s : subtasks)
                cout << "        - [" << (s.status ? "x" : " ") << "] "
                     << s.id << ". " << s.subtaskName << "\n";
        }
    }
};

// ---------- User ----------
class User {
public:
    int id;
    string name;
    string email;
    string password;

    User() : id(0) {}
    User(int id_, string name_, string email_, string password_)
        : id(id_), name(std::move(name_)),
          email(std::move(email_)), password(std::move(password_)) {}
};

// ---------- Exam ----------
class Exam {
public:
    int id;
    string subject;
    string examDate; // YYYY-MM-DD
    int userId;

    Exam(int id_, string subject_, string examDate_, int userId_)
        : id(id_), subject(std::move(subject_)),
          examDate(std::move(examDate_)), userId(userId_) {}

    void print() const {
        cout << "  [" << id << "] " << subject
             << "  | Date: " << examDate
             << "  | " << daysLeftLabel(examDate) << "\n";
    }
};

// ---------- TimetableEntry ----------
class TimetableEntry {
public:
    int id;
    string day;
    string timeSlot;
    string subject;
    int userId;

    TimetableEntry(int id_, string day_, string timeSlot_, string subject_, int userId_)
        : id(id_), day(std::move(day_)), timeSlot(std::move(timeSlot_)),
          subject(std::move(subject_)), userId(userId_) {}

    void editEntry(const string& d, const string& t, const string& s) {
        day = d; timeSlot = t; subject = s;
    }

    void print() const {
        cout << "  [" << id << "] " << day << " | " << timeSlot
             << " | " << subject << "\n";
    }
};

// ---------- AuthService ----------
class AuthService {
public:
    vector<User> users;
    User* currentUser = nullptr;
    int nextUserId = 1;

    User* registerUser(const string& name, const string& email, const string& password) {
        for (auto& u : users)
            if (u.email == email) { cout << "  ! Email already registered\n"; return nullptr; }
        users.emplace_back(nextUserId++, name, email, password);
        cout << "  + Registered user: " << name << "\n";
        return &users.back();
    }

    bool validateLogin(const string& email, const string& password) {
        for (auto& u : users) {
            if (u.email == email && u.password == password) {
                currentUser = &u;
                cout << "  + Logged in as " << u.name << "\n";
                return true;
            }
        }
        cout << "  ! Invalid email or password\n";
        return false;
    }

    void logout() {
        if (currentUser) cout << "  + Logged out " << currentUser->name << "\n";
        currentUser = nullptr;
    }
};

// ---------- CalendarService ----------
class CalendarService {
public:
    struct Event { string date, label, type; bool urgent; };

    vector<Event> mapDeadlines(const vector<Task>& tasks) {
        vector<Event> ev;
        for (auto& t : tasks)
            ev.push_back({ t.deadline, t.subject, "assignment",
                           calcDaysLeft(t.deadline) <= 2 });
        return ev;
    }

    vector<Event> mapExams(const vector<Exam>& exams) {
        vector<Event> ev;
        for (auto& e : exams) {
            int d = calcDaysLeft(e.examDate);
            ev.push_back({ e.examDate, e.subject, "exam", d <= 3 && d >= 0 });
        }
        return ev;
    }

    void renderCalendar(const vector<Task>& tasks, const vector<Exam>& exams) {
        auto a = mapDeadlines(tasks);
        auto b = mapExams(exams);
        a.insert(a.end(), b.begin(), b.end());
        sort(a.begin(), a.end(),
             [](const Event& x, const Event& y) { return x.date < y.date; });

        cout << "\n  ----- Calendar Events -----\n";
        if (a.empty()) { cout << "  (no events)\n"; return; }
        for (auto& e : a)
            cout << "  " << e.date << "  " << setw(11) << left << e.type
                 << "  " << e.label << (e.urgent ? "  [URGENT]" : "") << "\n";
    }
};

// ---------- ReminderService ----------
class ReminderService {
public:
    string checkTaskReminder(const Task& t) {
        int d = calcDaysLeft(t.deadline);
        if (d < 0)  return "Overdue: " + t.title;
        if (d == 0) return "Due today: " + t.title;
        if (d <= 2) return t.title + " due in " + to_string(d) + " day(s)";
        return "";
    }
    string checkExamReminder(const Exam& e) {
        int d = calcDaysLeft(e.examDate);
        if (d < 0)  return "";
        if (d == 0) return "Exam today: " + e.subject;
        if (d <= 3) return e.subject + " exam in " + to_string(d) + " day(s)";
        return "";
    }
};

// ---------- DashboardController ----------
class DashboardController {
public:
    vector<Task>           tasks;
    vector<Exam>           exams;
    vector<TimetableEntry> timetable;
    int nextTaskId = 1, nextSubId = 1, nextExamId = 1, nextEntryId = 1;

    void loadDashboard(const User& u) {
        cout << "\n  ===== Dashboard for " << u.name << " =====\n";
        cout << "  Tasks: " << tasks.size()
             << " | Exams: " << exams.size()
             << " | Timetable entries: " << timetable.size() << "\n";
    }

    void refreshData() { cout << "  + Data refreshed\n"; }

    void showStats() {
        int done = 0;
        for (auto& t : tasks) if (t.status == "completed") done++;
        cout << "  Total: " << tasks.size()
             << " | Completed: " << done
             << " | Pending: " << (tasks.size() - done) << "\n";
    }
};

// ---------- I/O helpers ----------
string readLine(const string& prompt) {
    cout << prompt;
    string s; getline(cin, s);
    return s;
}
int readInt(const string& prompt) {
    cout << prompt;
    int x; while (!(cin >> x)) {
        cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "  ! Enter a number: ";
    }
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    return x;
}

// ---------- Demo Menu ----------
int main() {
    AuthService           auth;
    DashboardController   dash;
    CalendarService       cal;
    ReminderService       rem;

    cout << "==========================================\n";
    cout << "   StudyPro (C++ Console Demo)\n";
    cout << "==========================================\n";

    while (true) {
        cout << "\n--- MENU ---\n";
        if (!auth.currentUser) {
            cout << " 1. Register\n 2. Login\n 0. Exit\n";
        } else {
            cout << " 3. Add Task        4. List Tasks      5. Toggle Subtask\n"
                 << " 6. Add Subtask     7. Edit Task       8. Delete Task\n"
                 << " 9. Add Exam        10. List Exams\n"
                 << " 11. Add Timetable  12. Show Timetable\n"
                 << " 13. Calendar View  14. Show Reminders 15. Dashboard\n"
                 << " 16. Logout         0. Exit\n";
        }
        int choice = readInt("> ");

        if (choice == 0) break;

        if (!auth.currentUser) {
            if (choice == 1) {
                string n = readLine("  Name: ");
                string e = readLine("  Email: ");
                string p = readLine("  Password: ");
                auth.registerUser(n, e, p);
            } else if (choice == 2) {
                string e = readLine("  Email: ");
                string p = readLine("  Password: ");
                auth.validateLogin(e, p);
            }
            continue;
        }

        int uid = auth.currentUser->id;

        switch (choice) {
        case 3: {
            string title    = readLine("  Title: ");
            string subject  = readLine("  Subject: ");
            string deadline = readLine("  Deadline (YYYY-MM-DD): ");
            string type     = readLine("  Type (Online/Offline): ");
            Task t(dash.nextTaskId++, title, subject, deadline, type, uid);
            int n = readInt("  How many subtasks? ");
            for (int i = 0; i < n; i++) {
                string s = readLine("    Subtask name: ");
                t.subtasks.emplace_back(dash.nextSubId++, t.id, s);
            }
            t.recalcProgress();
            dash.tasks.push_back(t);
            cout << "  + Task added (priority auto-set: " << t.priority << ")\n";
            break;
        }
        case 4:
            cout << "\n  ----- Your Tasks -----\n";
            if (dash.tasks.empty()) cout << "  (no tasks)\n";
            for (auto& t : dash.tasks) t.print();
            break;
        case 5: {
            int tid = readInt("  Task id: ");
            int sid = readInt("  Subtask id: ");
            for (auto& t : dash.tasks) if (t.id == tid)
                for (auto& s : t.subtasks) if (s.id == sid) {
                    s.toggleStatus(); t.recalcProgress();
                    cout << "  + Toggled. Progress: " << t.progress << "%\n";
                }
            break;
        }
        case 6: {
            int tid = readInt("  Task id: ");
            string nm = readLine("  Subtask name: ");
            for (auto& t : dash.tasks) if (t.id == tid) {
                t.subtasks.emplace_back(dash.nextSubId++, t.id, nm);
                t.recalcProgress();
                cout << "  + Subtask added\n";
            }
            break;
        }
        case 7: {
            int tid = readInt("  Task id: ");
            for (auto& t : dash.tasks) if (t.id == tid) {
                string ti = readLine("  New title: ");
                string su = readLine("  New subject: ");
                string dl = readLine("  New deadline (YYYY-MM-DD): ");
                string ty = readLine("  New type: ");
                t.editTask(ti, su, dl, ty);
                cout << "  + Task updated\n";
            }
            break;
        }
        case 8: {
            int tid = readInt("  Task id: ");
            dash.tasks.erase(remove_if(dash.tasks.begin(), dash.tasks.end(),
                [&](const Task& t){ return t.id == tid; }), dash.tasks.end());
            cout << "  + Task deleted\n";
            break;
        }
        case 9: {
            string s = readLine("  Subject: ");
            string d = readLine("  Exam date (YYYY-MM-DD): ");
            dash.exams.emplace_back(dash.nextExamId++, s, d, uid);
            cout << "  + Exam added\n";
            break;
        }
        case 10:
            cout << "\n  ----- Upcoming Exams -----\n";
            if (dash.exams.empty()) cout << "  (no exams)\n";
            for (auto& e : dash.exams) e.print();
            break;
        case 11: {
            string d = readLine("  Day (Mon/Tue/...): ");
            string t = readLine("  Time slot (e.g. 9:00-10:00): ");
            string s = readLine("  Subject: ");
            dash.timetable.emplace_back(dash.nextEntryId++, d, t, s, uid);
            cout << "  + Class added\n";
            break;
        }
        case 12:
            cout << "\n  ----- Timetable -----\n";
            if (dash.timetable.empty()) cout << "  (empty)\n";
            for (auto& e : dash.timetable) e.print();
            break;
        case 13:
            cal.renderCalendar(dash.tasks, dash.exams);
            break;
        case 14:
            cout << "\n  ----- Reminders -----\n";
            for (auto& t : dash.tasks) {
                string m = rem.checkTaskReminder(t);
                if (!m.empty()) cout << "  ! " << m << "\n";
            }
            for (auto& e : dash.exams) {
                string m = rem.checkExamReminder(e);
                if (!m.empty()) cout << "  ! " << m << "\n";
            }
            break;
        case 15:
            dash.loadDashboard(*auth.currentUser);
            dash.showStats();
            break;
        case 16:
            auth.logout();
            break;
        default:
            cout << "  ! Invalid choice\n";
        }
    }

    cout << "Goodbye!\n";
    return 0;
}
