const STORAGE_KEY = "habitgrid_data_v1";
const THEMES = ["green", "blue", "purple", "orange", "pink"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

let selectedTheme = "green";

let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    {id: "default_1", name: "Daily Coding", logs: {}}
];

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`
}

function calculateStreak(logs) {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    if (!logs[toDateKey(cursor)]) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (logs[toDateKey(cursor)] > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1)
    }

    return streak;
}

function addhabit(name) {
    habits.push({
        id: `habit_${Date.now()}`,
        name,
        theme: THEMES.includes(selectedTheme) ? selectedTheme: "green",
        logs: {}
    });
    save();
    render();
}

function deleteHabit(id) {
    habits = habits.filter((habit) => habit.id !== id);
    save();
    render();
}

function cycleLevel(habitId, dateKey) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const currentLevel = habit.logs[dateKey] || 0;
    const nextLevel = (currentLevel + 1) % 5;

    if (nextLevel === 0) {
        delete habit.logs[dateKey];
    } else {
        habit.logs[dateKey] = nextLevel;
    }

    save();
    render();
}

function render() {
    const container = document.getElementById("habits-container");
    if (!container) return;
    container.innerHTML = "";

    if (habits.length === 0) {
        container.innerHTML = `<p class="empty-state">No habits yet. Add one above to generate your first grid.</p>`;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDayKey = toDateKey(today);

    const end = new Date(today);
    end.setDate(today.getDate() + (6 - today.getDay()));
    const start = new Date(end);
    start.setDate(end.getDate() - 363);

    habits.forEach((habit) => {
        const currentTheme = THEMES.includes(habit.theme) ? habit.theme: "green";
        const card = document.createElement("article");
        card.className = "habit-card";
        card.dataset.theme = currentTheme;

        const header = document.createElement("div");
        header.className = "habit-header";

        const titleGroup = document.createElement("div");
        titleGroup.className = "habit-title-group";

        const title = document.createElement("span");
        title.className = "habit-title";
        title.textContent = habit.name;

        const themeDots = document.createElement("div");
        themeDots.className = "card-theme-dots";
        THEMES.forEach((themeName) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = `theme-dot ${currentTheme === themeName ? "active": ""}`;
            dot.dataset.theme = themeName;
            dot.title = `Switch to ${themeName}`;
            dot.addEventListener("click", () => updateHabitTheme(habit.id, themeName));
            themeDots.appendChild(dot);
        });

        titleGroup.append(title, themeDots);

        const actions = document.createElement("div");
        actions.className = "habit-actions";

        const {currentStreak, bestStreak, totalDays} = calculateStats(habit.logs || {});

        const streak = document.createElement("span");
        streak.className = "streak-badge";
        streak.innerHTML = `Streak: <strong>${currentStreak}d</strong>`;

        const best = document.createElement("span");
        best.className = "streak-badge";
        best.innerHTML = `Best: <strong>${bestStreak}d</strong>`;

        const logTodayBtn = document.createElement("button");
        logTodayBtn.type = "button";
        logTodayBtn.className = "btn-small";
        logTodayBtn.textContent = "+ Log Today";
        logTodayBtn.addEventListener("click", () => cycleLevel(habit.id, toDayKey));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.title = "Delete habit";
        deleteBtn.addEventListener("click", () => deleteHabit(habit.id));

        actions.append(streak, best, logTodayBtn, deleteBtn);
        header.append(titleGroup, actions);

        const wrapper = document.createElement("div");
        wrapper.className = "grid-wrapper";

        const calendarLayout = document.createElement("div");
        calendarLayout.className = "calendar-layout";

        const grid = document.createElement("div");
        grid.className = "grid";

        for (let i = 0; i < 364; i++) {
            const cellDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const key = toDateKey(cellDate);
            const level = (habit.logs && habit.logs[key]) || 0;
            
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.level = level;
            cell.title = `${key} - Level ${level}`;

            if (cellDate > today) {
                cell.classList.add("future");             
            } else {
                cell.addEventListener("click", () => cycleLevel(habit.id, key));
            }

            grid.appendChild(cell);
        }

        calendarLayout.append(buildMonthLabels(start), buildWeekdayLabels(), grid);
        wrapper.appendChild(calendarLayout);
        card.append(header, wrapper);
        container.appendChild(card);
    });
}

document.getElementById("habit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("habit-input");
    const name = input.value.trim();

    if (name) {
        addhabit(name);
        input.value = "";
    }
});

render();

function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function calculateStats(logs) {
    const activeKeys = Object.keys(logs)
        .filter((key) => logs[key] > 0)
        .sort();
    
        const totalDays = activeKeys.length;
        const currentStreak = calculateStreak(logs);

        let bestStreak = 0;
        let running = 0;
        let prevDate = null;

        for (const key of activeKeys) {
            const currDate = parseDateKey(key);
            if (prevDate) {
                const diffDays = Math.round((currDate - prevDate) / 86400000);
                running = diffDays === 1 ? running + 1 : 1;
            } else {
                running = 1;
            }

            if (running > bestStreak) {
                bestStreak = running;
            }

            prevDate = currDate
        }
        return {currentStreak, bestStreak, totalDays};
}

function updateHabitTheme(habitId, theme) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || !THEMES.includes(theme)) return;
    habit.theme = theme;
    save();
    render();
}

function buildMonthLabels(startDate) {
    const row = document.createElement("div");
    row.className = "month-labels";
    let lastMonth = -1;

    for (let week = 0; week < 52; week++) {
        const weekSunday = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + week * 7);
        const month = weekSunday.getMonth();
        const label = document.createElement("span");

        const nextWeekSunday = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (week + 1) * 7);
        const skipFirstWeekCollision = week === 0 && nextWeekSunday.getMonth() !== month;

        if (month !== lastMonth && !skipFirstWeekCollision) {
            label.textContent = MONTH_NAMES[month];
            lastMonth = month;
        }

        row.appendChild(label);
        
    }

    return row;
}

function buildWeekdayLabels() {
    const col = document.createElement("div");
    col.className = "weekday-labels";

    WEEKDAY_LABELS.forEach((dayText) => {
        const span = document.createElement("span");
        span.textContent = dayText;
        col.appendChild(span);
    });

    return col;
}

function exportHabits(params) {
    const blob = new Blob([JSON.stringify(habits, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habitgrid-backup-${toDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importHabits(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target.result);
            const list = Array.isArray(parsed) ? parsed : parsed && parsed.habits;

            if (!Array.isArray(list)) {
                alert("Invalid backup file format.")
                return;
            }

            const validHabits = list 
                .filter((item) => item && typeof(item.name) === "string" && item.name.trim() != "")
                .map((item, idx) => ({
                    id: item.id || `imported_${Date.now()}_${idx}`,
                    name: item.name.trim().slice(0,60),
                    theme: THEMES.includes(item.theme) ? item.theme : "green",
                    logs: item.logs && typeof(item.logs) === "object" && !Array.isArray(item.logs) ? item.logs : {}
                }));
            
            if (validHabits.length === 0) {
                alert("No habits found in this backup file.");
                return;
            }

            habits = validHabits;
            save();
            render();
        } catch (err) {
            alert("Could not read JSON file.")
        }
    };

    reader.readAsText(file);
}

const swatches = document.querySelectorAll("#theme-picker .swatch");
swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
        swatches.forEach((s) => s.classList.remove("active"));
        swatch.classList.add("active");
        selectedTheme = swatch.dataset.theme;
    });
});

const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
    exportBtn.addEventListener("click", exportHabits);
}

const importBtn = document.getElementById("import-btn");
let importFile = document.getElementById("import-file");

if (importBtn) {
    if (!importFile) {
        importFile = document.createElement("input");
        importFile.type = "file";
        importFile.id = "import-file";
        importFile.accept = ".json,application/json";
        document.body.appendChild(importFile);
    }

    importFile.hidden = false;
    importFile.style.cssText = "position:fixed;left:-9999px;opacity:0;";

    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", (event) => {
        importHabits(event.target.files[0]);
        importFile.value = "";
    });
}

function deleteAllHabits() {
    if (habits.length === 0);

    const confirmed = confirm("Are your sure you want to delete all habits? This cannot be undone.");
    if (!confirmed) return;

    habits = [];
    save();
    render();
}

const deleteAllBtn = document.getElementById("delete-all-btn");
if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", deleteAllHabits);
}