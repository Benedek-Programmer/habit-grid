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
    if (habits.length === 0) return;

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

const APPEARANCE_KEY = "habitgrid_appearance_v1";
let appearance = localStorage.getItem(APPEARANCE_KEY) === "light" ? "light" : "dark";

function applyAppearance() {
    document.documentElement.dataset.appearance = appearance;
    const modeBtn = document.getElementById("theme-mode-btn");
    if (modeBtn) {
        const isLight = appearance === "light";
        modeBtn.textContent = isLight ? "🌙 Dark" : "☀️ Light";
        modeBtn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
    }
}

function toggleAppearance() {
    appearance = appearance === "light" ? "dark" : "light";
    localStorage.setItem(APPEARANCE_KEY, appearance);
    applyAppearance();
}

const PNG_PALETTES = {
    dark: {
        cardBg: "#1e293b",
        border: "#334155",
        title: "#f8fafc",
        muted: "#94a3b8",
        themes: {
            green: {accent: "#22c55e", levels: ["#334155", "#166534", "#15803d", "#22c55e", "#86efac"]},
            blue: {accent: "#3b82f6", levels: ["#334155", "#1e3a8a", "#1d3ed8", "#3b82f6", "#93c5fd"]},
            purple: {accent: "#a855f7", levels: ["#334155", "#4c1d95", "#6d28d9", "#a855f7", "#d8b4fe"]},
            orange: {accent: "#f97316", levels: ["#334155", "#7c2d12", "#c2410c", "#f97316", "#fdba74"]},
            pink: {accent: "#ec4899", levels: ["#334155", "#831843", "#be185d", "#ec4899", "#f9a8d4"]}
        }
    },
    light: {
        cardBg: "#ffffff",
        border: "#cbd5e1",
        title: "#0f172a",
        muted: "#475569",
        themes: {
            green: {accent: "#16a34a", levels: ["#e2e8f0", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"]},
            blue: {accent: "#2563eb", levels: ["#e2e8f0", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"]},
            purple: {accent: "#9333ea", levels: ["#e2e8f0", "#e9d5ff", "#c084fc", "#9333ea", "#581c87"]},
            orange: {accent: "#ea580c", levels: ["#e2e8f0", "#fed7aa", "#fb923c", "#ea580c", "#7c2d12"]},
            pink: {accent: "#db2777", levels: ["#e2e8f0", "#fbcfe8", "#f472b6", "#db2777", "#831843"]}
        }
    }
};

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function exportHabitPng(habit) {
    const modePalette = PNG_PALETTES[appearance === "light" ? "light" : "dark"];
    const themeKey = THEMES.includes(habit.theme) ? habit.theme : "green";
    const palette = modePalette.themes[themeKey];
    const logs = habit.logs || {};
    const {currentStreak, bestStreak, totalDays} = calculateStats(logs);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 363);

    const scale = 2;
    const padX = 28;
    const padY = 26;
    const headerHeight = 54;
    const labelColWidth = 34;
    const monthRowHeight = 20;
    const cellSize = 13;
    const gap = 4;
    const footerHeight = 32;

    const gridWidth = 52 * cellSize + 51 * gap;
    const gridHeight = 7 * cellSize + 6 * gap;
    const width = padX * 2 + labelColWidth + gridWidth;
    const height = padY * 2 + headerHeight + monthRowHeight + gridHeight + 16 + footerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    ctx.fillStyle = modePalette.cardBg;
    drawRoundedRect(ctx, 0, 0, width, height, 14);
    ctx.fill();

    ctx.strokeStyle = modePalette.border;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 0.75, 0.75, width - 1.5, height - 1.5, 14);
    ctx.stroke();

    const fontStack = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    ctx.fillStyle = modePalette.title;
    ctx.font = `700 19px ${fontStack}`;
    ctx.textBaseline = "top";
    ctx.fillText(habit.name, padX, padY);

    ctx.fillStyle = modePalette.muted;
    ctx.font = `500 12px ${fontStack}`;
    ctx.fillText(`52-Week Habit Snapshot • ${toDateKey(new Date())}`, padX, padY + 26);

    const stats = [
        {label: "Total: ", value: `${totalDays}d`},
        {label: "Best: ", value: `${bestStreak}d`},
        {label: "Streak: ", value: `${currentStreak}d`}
    ];

    let cursorX = width - padX;
    ctx.font = `600 13px ${fontStack}`;
    stats.forEach((stats) => {
        const valWidth = ctx.measureText(stats.value). width;
        cursorX -= valWidth;
        ctx.fillStyle = palette.accent;
        ctx.fillText(stats.value, cursorX, padY + 4);

        const lblWidth = ctx.measureText(stats.label).width;
        cursorX -= lblWidth;
        ctx.fillStyle = modePalette.muted;
        ctx.fillText(stats.label, cursorX, padY + 4);

        cursorX -= 16;
    });

    const gridOriginX = padX + labelColWidth;
    const gridOriginY = padY + headerHeight + monthRowHeight;

    ctx.fillStyle = modePalette.muted;
    ctx.font = `500 11px ${fontStack}`;
    let lastMonth = -1;
    for (let week = 0; week < 52; week++) {
        const weekSunday = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + week * 7);
        const month = weekSunday.getMonth();
        const nextWeekSunday = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (week + 1) * 7);
        const skipFirstWeekCollision = week === 0 && nextWeekSunday.getMonth() !== month;

        if (month !== lastMonth && !skipFirstWeekCollision) {
            ctx.fillText(MONTH_NAMES[month], gridOriginX + week * (cellSize + gap), padY + headerHeight + 2);
            lastMonth = month;
        }
    }

    WEEKDAY_LABELS.forEach((dayText, rowIdx) => {
        if (!dayText) return;
        ctx.fillText(dayText, padX, gridOriginY + rowIdx * (cellSize + gap) + 1);
    });

    for (let i = 0; i < 364; i++) {
        const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        const key = toDateKey(cellDate);
        const level = logs[key] || 0;

        const col = Math.floor(i / 7);
        const row = i % 7;
        const x = gridOriginX + col * (cellSize + gap);
        const y = gridOriginY + row * (cellSize + gap);

        ctx.globalAlpha = cellDate > today ? 0.25 : 1;
        ctx.fillStyle = palette.levels[level] || palette.levels[0];
        drawRoundedRect(ctx, x, y, cellSize, cellSize, 3);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    const footerY = gridOriginY + gridHeight + 18;
    ctx.fillStyle = modePalette.muted;
    ctx.font = `700 12px ${fontStack}`;
    ctx.fillText("HabitGrid", padX, footerY);

    let legendX = width- padX;
    const moreText = "More";
    legendX -= ctx.measureText(moreText).width;
    ctx.font = `500 12px ${fontStack}`;
    ctx.fillText(moreText, legendX, footerY);
    legendX -= 6;

    for (let lvl = 4; lvl < 0; lvl--) {
        legendX -= cellSize;
        ctx.fillStyle = palette.levels[lvl];
        drawRoundedRect(ctx, legendX, footerY, cellSize, cellSize, 3);
        ctx.fill();
        legendX -= 4;
    }

    const lessText = "Less";
    legendX -= (ctx.measureText(lessText).width + 2);
    ctx.fillStyle = modePalette.muted;
    ctx.fillText(lessText, legendX, footerY);

    const slug = habit.name.toLowerCase().replace(/[\W_]+/g, "-").replace(/^-+|-+$/g, "") || "habit";
    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${slug}-habitgrid-${toDateKey(new Date())}.png`;
        link.click();
        URL.revokeObjectURL(url);
    }, "image/png");
}

function injectShareButtons() {
    const card = document.querySelectorAll("#habits-container .habit-card");
    card.forEach((card, index) => {
        const habit = habits[index];
        const actions = card.querySelector(".habit-actions");
        const deleteBtn = actions ? actions.querySelector(".btn-delete") : null;
        if (!habit || !actions || actions.querySelector(".btn-share")) return;

        const shareBtn = document.createElement("button");
        shareBtn.type = "button";
        shareBtn.className = "btn-share";
        shareBtn.title = "Download a PNG snapshot of your progress";
        shareBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y="15" x2="12" y2="3"></line>
            </svg>
            <span>Share PNG</span>
         `;
         shareBtn.addEventListener("click", () => exportHabitPng(habit));

         if (deleteBtn) {
            actions.insertBefore(shareBtn, deleteBtn);
         } else {
            actions.appendChild(shareBtn);
         }
    });
}

const baseRender = render;
render = function() {
    applyAppearance();
    baseRender();
    injectShareButtons();
};

const themeModeBtn = document.getElementById("theme-mode-btn");
if (themeModeBtn) {
    themeModeBtn.addEventListener("click", toggleAppearance);
}

applyAppearance();
injectShareButtons();