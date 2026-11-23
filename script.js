const STORAGE_KEY = "habitgrid_data_v1";
const THEMES = ["green", "blue", "purple", "orange", "pink"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

let selectedTheme = "green";

let habits = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: "default_1", name: "Daily Coding", logs: {} }
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
        theme: THEMES.includes(selectedTheme) ? selectedTheme : "green",
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
        const currentTheme = THEMES.includes(habit.theme) ? habit.theme : "green";
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
            dot.className = `theme-dot ${currentTheme === themeName ? "active" : ""}`;
            dot.dataset.theme = themeName;
            dot.title = `Switch to ${themeName}`;
            dot.addEventListener("click", () => updateHabitTheme(habit.id, themeName));
            themeDots.appendChild(dot);
        });

        titleGroup.append(title, themeDots);

        const actions = document.createElement("div");
        actions.className = "habit-actions";

        const { currentStreak, bestStreak, totalDays } = calculateStats(habit.logs || {});

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
    return { currentStreak, bestStreak, totalDays };
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
    const blob = new Blob([JSON.stringify(habits, null, 2)], { type: "application/json" });
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
                .filter((item) => item && typeof (item.name) === "string" && item.name.trim() != "")
                .map((item, idx) => ({
                    id: item.id || `imported_${Date.now()}_${idx}`,
                    name: item.name.trim().slice(0, 60),
                    theme: THEMES.includes(item.theme) ? item.theme : "green",
                    logs: item.logs && typeof (item.logs) === "object" && !Array.isArray(item.logs) ? item.logs : {}
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
            green: { accent: "#22c55e", levels: ["#334155", "#166534", "#15803d", "#22c55e", "#86efac"] },
            blue: { accent: "#3b82f6", levels: ["#334155", "#1e3a8a", "#1d3ed8", "#3b82f6", "#93c5fd"] },
            purple: { accent: "#a855f7", levels: ["#334155", "#4c1d95", "#6d28d9", "#a855f7", "#d8b4fe"] },
            orange: { accent: "#f97316", levels: ["#334155", "#7c2d12", "#c2410c", "#f97316", "#fdba74"] },
            pink: { accent: "#ec4899", levels: ["#334155", "#831843", "#be185d", "#ec4899", "#f9a8d4"] }
        }
    },
    light: {
        cardBg: "#ffffff",
        border: "#cbd5e1",
        title: "#0f172a",
        muted: "#475569",
        themes: {
            green: { accent: "#16a34a", levels: ["#e2e8f0", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"] },
            blue: { accent: "#2563eb", levels: ["#e2e8f0", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"] },
            purple: { accent: "#9333ea", levels: ["#e2e8f0", "#e9d5ff", "#c084fc", "#9333ea", "#581c87"] },
            orange: { accent: "#ea580c", levels: ["#e2e8f0", "#fed7aa", "#fb923c", "#ea580c", "#7c2d12"] },
            pink: { accent: "#db2777", levels: ["#e2e8f0", "#fbcfe8", "#f472b6", "#db2777", "#831843"] }
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
    const { currentStreak, bestStreak, totalDays } = calculateStats(logs);

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
        { label: "Total: ", value: `${totalDays}d` },
        { label: "Best: ", value: `${bestStreak}d` },
        { label: "Streak: ", value: `${currentStreak}d` }
    ];

    let cursorX = width - padX;
    ctx.font = `600 13px ${fontStack}`;
    stats.forEach((stats) => {
        const valWidth = ctx.measureText(stats.value).width;
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

    let legendX = width - padX;
    const moreText = "More";
    legendX -= ctx.measureText(moreText).width;
    ctx.font = `500 12px ${fontStack}`;
    ctx.fillText(moreText, legendX, footerY);
    legendX -= 6;

    for (let lvl = 4; lvl >= 0; lvl--) {
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
render = function () {
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

let currentView = "grid";
let activeDetailHabitId = null;


function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/&/g, "&lt;")
        .replace(/&/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function switchView(viewName, habitId) {
    const validViews = ["grid", "stats", "habit", "templates", "achievements", "about"];
    const target = validViews.includes(viewName) ? viewName : "grid";
    currentView = target;

    if (target === "habit") {
        activeDetailHabitId = habitId || activeDetailHabitId || (habits[0] && habits[0].id) || null;
    }

    document.querySelectorAll(".app-view").forEach((section) => {
        section.hidden = section.id !== `view-${target}`;
    });

    document.querySelectorAll(".app-nav .nav-link").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.view === target);
    });

    if (target === "grid") {
        render();
    } else {
        refreshactiveView();
    }
}

document.querySelectorAll(".app-nav .nav-link").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
});

let activeNoteTarget = null;

function ensureNoteModal() {
    let backdrop = document.getElementById("note-modal-backdrop")
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "note-modal-backdrop";
    backdrop.className = "note-modal-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = `
        <div class="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
            <h3 id="note-modal-title">Daily Square Note</h3>
            <p id="note-modal-meta" class="note-modal-meta"></p>
            <textarea id="note-modal-textarea" class="note-textarea" maxlength="240" placeholder="Write a quick note about your session (e.g., Finished chapter 4, 5km run)..."></textarea>
            <div class="note-modal-actions">
                <button type="button" id="note-clear-btn" class="btn-delete">Clear Note</button>
                <button type="button" id="note-cancel-btn" class="btn-small">Cancel</button>
                <button type="button" id="note-save-btn" class="btn-primary">Save Note</button>
            </div>
         </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) closeNoteModal();
    });

    document.getElementById("note-cancel-btn").addEventListener("click", closeNoteModal);

    document.getElementById("note-clear-btn").addEventListener("click", () => {
        if (!activeNoteTarget) return;
        const {habitId, dateKey} = activeNoteTarget;
        const habit = habits.find((h) => h.id === habitId);
        if (habit && habit.notes) {
            delete habit.notes[dateKey];
            save();
        }
        closeNoteModal();
        render();
    });

    document.getElementById("note-save-btn").addEventListener("click", () => {
        if (!activeNoteTarget) return;
        const {habitId, dateKey} = activeNoteTarget;
        const habit = habits.find((h) => h.id === habitId);
        const text = document.getElementById("note-modal-textarea").value.trim();
        if (habit) {
            if (!habit.notes) habit.notes = {};
            if (text) {
                habit.notes[dateKey] = text;
                if (!habit.logs[dateKey]) {
                    habit.logs[dateKey] = 1;
                }
            } else {
                delete habit.notes[dateKey];
            }
            save();
        }
        closeNoteModal();
        render();
    });

    return backdrop;
}

function openNoteModal(habitId, dateKey) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const backdrop = ensureNoteModal();
    activeNoteTarget = {habitId, dateKey};

    const level = (habit.logs&& habit.logs[dateKey]) || 0;
    const customLabel = habit.levels && habit.levels[level] ? ` (${habit.levels[level]})` : "";
    document.getElementById("note-modal-title").textContent = habit.name;
    document.getElementById("note-modal-meta").textContent = `${dateKey} • Level ${level}${customLabel}`;

    const textarea = document.getElementById("note-modal-textarea");
    textarea.value = (habit.notes && habit.notes[dateKey]) || "";
    backdrop.hidden = false;
    textarea.focus();
}

function closeNoteModal() {
    const backdrop = document.getElementById("note-modal-backdrop");
    if (backdrop) backdrop.hidden = true;
    activeNoteTarget = null;
}

function formatCellToolTip(habit, dateKey, level) {
    const customLabel = habit.levels && habit.levels[level] ? ` (${habit.levels[level]})` : "";
    const noteText = habit.notes && habit.notes[dateKey] ? ` • Note: ${habit.notes[dateKey]}` : "";
    return `${dateKey} - Level ${level}${customLabel}${noteText} (right-click for note)`;
}

function attachCellNoteHandlers(cell, habit, dateKey, level) {
    if (habit.notes && habit.notes[dateKey]) {
        cell.classList.add("has-note");
    }
    cell.title = formatCellToolTip(habit, dateKey, level);

    cell.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        openNoteModal(habit.id, dateKey);
    });

    let pressTimer = null;
    cell.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => openNoteModal(habit.id, dateKey), 500 );
    }, {passive: true});
    cell.addEventListener("touchend", () => clearTimeout(pressTimer));
    cell.addEventListener("touchmove", () => clearTimeout(pressTimer));
}

let draggedHabitId = null;

function toggleArchiveHabit(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    habit.archived = !habit.archived;
    save();
    render();
}

function reorderHabits(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId   === targetId) return;
    const fromIndex = habits.findIndex((h) => h.id === sourceId);
    const toIndex = habits.findIndex((h) => h.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = habits.splice(fromIndex, 1);
    habits.splice(toIndex, 0, moved);
    save();
    render();
 }

 function renderTodayQuickBar() {
    const bar = document.getElementById("today-bar");
    if (!bar) return;
    bar.innerHTML = "";

    const activeHabits = habits.filter((h) => !h.archived);
    if (activeHabits.length === 0) return;

    const todayKey = toDateKey(new Date());
    const label = document.createElement("span");
    label.className = "today-bar-label";
    label.textContent = "Today: ";
    bar.appendChild(label);

    activeHabits.forEach((habit) => {
        const level = (habit.logs && habit.logs[todayKey]) || 0;
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `today-pill ${level > 0 ? "done" : ""}`;
        pill.dataset.theme = THEMES.includes(habit.theme) ? habit.theme : "green";
        pill.title = "Click to cycle today's intensity level";
        pill.innerHTML = `
            <span class="today-pill-dot"></span>
            <span>${escapeHtml(habit.name)}${level > 0 ? ` (Lv ${level})` : ""}</span>
        `;
        pill.addEventListener("click", () => cycleLevel(habit.id, todayKey));
        bar.appendChild(pill)
    });
 }

 function renderArchivedDrawer() {
    const section = document.getElementById("archived-section");
    if (!section) return;
    section.innerHTML = "";

    const archivedHabits = habits.filter((h) => h.archived);
    if (archivedHabits.length === 0) return;

    const details = document.createElement("details");
    details.className = "archived-details";

    const summary = document.createElement("summary");
    summary.className = "archived-summary";
    summary.textContent = `📦 Archived Habits (${archivedHabits.length}) - Click to expand`;

    const list = document.createElement("div");
    list.className = "archived-list";

    archivedHabits.forEach((habit) => {
        const {totalDays, bestStreak} = calculateStats(habit.logs || {});
        const item = document.createElement ("div");
        item.className = "archived-item";
        item.innerHTML = `
            <div>
                <strong>${escapeHtml(habit.name)}</strong>
                <span class="streak-badge"> • ${totalDays}d logged • Best: ${bestStreak}d</span>
            </div>
        `;

        const btns = document.createElement("div");
        btns.className = "backup-controls";

        const restoreBtn = document.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.className = "btn-small";
        restoreBtn.textContent = "Restore";
        restoreBtn.addEventListener("click", () => toggleArchiveHabit(habit.id));

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "btn-delete";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteHabit(habit.id));

        btns.append(restoreBtn, deleteBtn);
        item.appendChild(btns);
        list.appendChild(item);
    });

    details.append(summary, list);
    section.appendChild(details)
}

function enhanceIndexCards() {
    const container = document.getElementById("habits-container");
    if (!container) return;

    const cards = Array.from(container.querySelectorAll(".habit-card"));
    cards.forEach((card, index) => {
        const habit = habits[index];
        if (!habit) return;

        if (habit.archived) {
            card.remove();
            return;
        }

        const titleGroup = card.querySelector(".habit-title-group");
        const titleSpan = card.querySelector(".habit-title");
        if (titleGroup && titleSpan && !titleGroup.querySelector(".drag-handle")) {
            const handle = document.createElement("span");
            handle.className = "drag-handle";
            handle.textContent = "⋮⋮";
            handle.title = "Drag card to reorder";
            titleGroup.insertBefore(handle, titleSpan);

            const titleBtn = document.createElement("button");
            titleBtn.type = "button";
            titleBtn.className = "habit-title-link";
            titleBtn.title = "Open habit deep dive, custom levels & notes";
            titleBtn.textContent = habit.name;
            titleBtn.addEventListener("click", () => switchView("habit", habit.id));
            titleSpan.textContent = "";
            titleSpan.appendChild(titleBtn);
        }

        const actions = card.querySelector(".habit-actions");
        const shareBtn = actions ? actions.querySelector(".btn-share") : null;
        const deleteBtn = actions ? actions.querySelector(".btn-share") : null;

        if (actions && !actions.querySelector(".btn-link-subtle")) {
            const detailsBtn = document.createElement("button");
            detailsBtn.type = "button";
            detailsBtn.className = "btn-link-subtle";
            detailsBtn.textContent = "Details";
            detailsBtn.addEventListener("click", () => switchView("habit", habit.id));
            actions.insertBefore(detailsBtn, shareBtn || deleteBtn);
        }

        if (actions && !actions.querySelector(".btn-archive")) {
            const archiveBtn = document.createElement("button");
            archiveBtn.type = "button";
            archiveBtn.className = "btn-archive";
            archiveBtn.textContent = "Archive";
            archiveBtn.title = "Move habit to archive";
            archiveBtn.addEventListener("click", () => toggleArchiveHabit(habit.id));
            actions.insertBefore(archiveBtn, deleteBtn);
        }

        card.querySelectorAll(".grid .cell").forEach((cell) => {
            if (cell.classList.contains("future")) return;
            const dateKey = cell.title.slice(0, 10);
            const level = Number(cell.dataset.level) || 0;
            attachCellNoteHandlers(cell, habit, dateKey, level);
        });

        card.draggable = true;
        card.addEventListener("dragstart", () => {
            draggedHabitId = habit.id;
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
            draggedHabitId = null;
            card.classList.remove("dragging");
            container.querySelectorAll(".habit-card").forEach((c) => c.classList.remove("drag-over"));
        });
        card.addEventListener("dragover", (event) => {
            event.preventDefault();
            if (draggedHabitId && draggedHabitId !== habit.id) {
                card.classList.add("drag-over");
            }
        });
        card.addEventListener("dragleave", () => {
            card.classList.remove("drag-over");
        });
        card.addEventListener("drop", (event) => {
            event.preventDefault();
            card.classList.remove("drag-over");
            reorderHabits(draggedHabitId, habit.id);
        });
    });

    if (habits.length > 0 && habits.every((h) => h.archived)) {
        container.innerHTML = `<p class="empty-state">All habits are archived. Restore one below or add a new habit above.</p>`;
    }

    renderTodayQuickBar();
    renderArchivedDrawer();
}

// Sub view 1

function renderStatsView() {
    const page = document.getElementById("view-stats");
    if (!page) return;

    const activeHabits = habits.filter((h) => !h.archived);
    if (habits.length === 0) {
        page.innerHTML = `<p class="empty-state">No habits tracked yet. Head to <strong>Grid</strong> or <strong>Templates</strong> to get started.</p>`;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6- today.getDay()));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 363);

    const dailyCounts = {};
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    let totalCheckIns = 0;
    let topBestStreak = 0;
    let topStreakHabit = "-";
    let last30Completed = 0;
    const last30Possible = Math.max(1, activeHabits.length * 30);

    const last30Cutoff = new Date(today);
    last30Cutoff.setDate(today.getDate() - 29);

    habits.forEach((habit) => {
        const logs = habit.logs || {};
        const stats = calculateStats(logs);
        totalCheckIns += stats.totalDays;
        if (stats.bestStreak > topBestStreak) {
            topBestStreak = stats.bestStreak;
            topStreakHabit = habit.name;
        }

        Object.keys(logs).forEach((key) => {
            if (logs[key] > 0) {
                dailyCounts[key] = (dailyCounts[key] || 0) + 1;
                const d  = parseDateKey(key);
                weekdayCounts[d.getDay()] += 1;
                if (!habit.archived && d >= last30Cutoff && d <= today) {
                    last30Completed += 1;
                }
            }
        });
    });

    const consistencyPct = Math.round((last30Completed / last30Possible) * 100);
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxWeekday = Math.max(1, ...weekdayCounts);
    const bestDayIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts));

    page.innerHTML = `
        <section class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Active Habits</div>
                <div class="kpi-value">${activeHabits.length}</div>
                <div class="kpi-sub">${habits.length - activeHabits.length} archived</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Check-Ins</div>
                <div class="kpi-value">${totalCheckIns}</div>
                <div class="kpi-sub">All-time logged squares</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">All-Time Best Streak</div>
                <div class="kpi-value">${topBestStreak}d</div>
                <div class="kpi-sub">${escapeHtml(topStreakHabit)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">30-Day Consistency</div>
                <div class="kpi-value">${consistencyPct}%</div>
                <div class="kpi-sub">Strongest day: ${weekdayNames[bestDayIdx]}</div>
            </div>
        </section>

        <article class="habit-card">
            <h2 class="section-heading">Combined 52-Week Master Heatmap</h2>
            <div id="master-heatmap-wrap" class="grid-wrapper"></div>
        </article>

        <article class="habit-card">
            <h2 class="section-heading">Completions by Day of Week</h2>
            <div class="weekday-bars">
                ${weekdayNames.map((day, idx) => {
                    const count = weekdayCounts[idx];
                    const heightPct = Math.max(6, Math.round((count / maxWeekday) * 100));
                    return `
                        <div class="weekday-bar-col">
                            <span class="weekday-bar-count">${count}</span>
                            <div class="weekday-bar-fill" style="height: ${heightPct}%;"></div>
                            <span class="weekday-bar-name">${day}</span>
                        </div>
                    `;
                }).join("")}
            </div>
        </article>

        <article class="habit-card">
            <h2 class="section-heading">Habit Breakdown</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Habit</th>
                        <th>Current</th>
                        <th>Best</th>
                        <th>Total</th>
                        <th>30-Day Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${habits.map((h) => {
                        const s = calculateStats(h.logs || {});
                        let recent = 0;
                        Object.keys(h.logs || {}).forEach((k) => {
                            const d = parseDateKey(k);
                            if (h.logs[k] > 0 && d >= last30Cutoff && d <= today) recent++;
                        });
                        const rate = Math.round((recent / 30) * 100);
                        return `
                            <tr>
                                <td>
                                    <button type="button" class="habit-title-link" data-open-habit="${escapeHtml(h.id)}">
                                        <strong>${escapeHtml(h.name)}</strong>
                                    </button>
                                    ${h.archived ? `<span class="streak-badge"> (Archived)</span>` : ""}
                                </td>
                                <td>${s.currentStreak}d</td>
                                <td>${s.bestStreak}d</td>
                                <td>${s.totalDays}d</td>
                                <td style="min-width: 120px;">
                                    <div class="progress-track" title="${rate}% (${recent}/30 days)">
                                        <div class="progress-fill" style="width: ${rate}%;"></div>
                                    </div>
                                </td>
                            </tr>
                        `;
                        }).join("")}
                </tbody>
            </table>
        </article>
    `;

    page.querySelectorAll("[data-open-habit]").forEach((btn) => {
        btn.addEventListener("click", () => switchView("habit", btn.dataset.openHabit));
    });

    const wrap = document.getElementById("master-heatmap-wrap");
    const layout = document.createElement("div");
    layout.className = "calendar-layout";
    const grid = document.createElement("div");
    grid.className = "grid";

    const denominator = Math.max(1, activeHabits.length);
    for (let i = 0; i < 364; i++) {
        const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        const key = toDateKey(cellDate);
        const count = dailyCounts[key] || 0;
        const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / denominator) * 4));

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.level = level;
        cell.title = `${key}: ${count} habit${count === 1 ? "" : "s"} completed`;
        if (cellDate > today) cell.classList.add("future");
        grid.appendChild(cell)
    }

    layout.append(buildMonthLabels(startDate), buildWeekdayLabels(), grid);
    wrap.appendChild(layout);
}

// Sub view 2

function calculateWeeklyGoalStreak(logs, weeklyGoal) {
    const goal = Number(weeklyGoal) || 7;
    if (goal >= 7) return calculateStreak(logs);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - today.getDay());

    let weekStreak = 0;
    for (let w = 0; w < 52; w++) {
        const weekStart = new Date(currentSunday);
        weekStart.setDate(currentSunday.getDate() - w * 7);
        let count = 0;
        for (let d = 0; d < 7; d++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + d);
            if (logs[toDateKey(day)] > 0) count++;
        }
        if (count >= goal) {
            weekStreak++;
        } else if (w > 0) {
            break;
        }
    }
    return weekStreak;
}

function renderHabitDetailView() {
    const page = document.getElementById("view-habit");
    if (!page) return;

    if (habits.length === 0) {
        page.innerHTML = `<p class="empty-state">No habits found. Add a habit on the <strong>Grid</strong> first.</p>`;
        return;
    }

    const habit = habits.find((h) => h.id === activeDetailHabitId) || habits[0];
    activeDetailHabitId = habit.id;

    const currentTheme = THEMES.includes(habit.theme) ? habit.theme : "green";
    const logs = habit.logs || {};
    const notes = habit.notes || {};
    const levels = habit.levels || {};
    const weeklyGoal = Number(habit.weeklyGoal || 7);

    const {currentStreak, bestStreak, totalDays} = calculateStats(logs);
    const weeklyStreak = calculateWeeklyGoalStreak(logs, weeklyGoal);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toDateKey(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 363);

    const noteEntries = Object.keys(notes)
        .filter((k) => notes[k] && notes[k].trim() != "")
        .sort()
        .reverse();

    page.innerHTML = `
        <div class="detail-top-bar">
            <div class="backup-controls">
                <button type="button" id="detail-back-btn" class="btn-small">← Back to Grid</button>
                <select id="habit-switcher" class="detail-select" aria-label="Select-habit">
                    ${habits.map((h) => `<option value="${escapeHtml(h.id)}" ${h.id === habit.id ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
                </select>
            </div>
            <div class="backup-controls">
                <button type="button" id="detail-log-today" class="btn-small">+ Log Today</button>
                <button type="button" id="detail-share-png" class="btn-share">Share PNG</button>
            </div>
        </div>

        <section class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Daily Streak</div>
                <div class="kpi-value">${currentStreak}d</div>
                <div class="kpi-sub">Best: ${bestStreak}d</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Weekly Goal (${weeklyGoal}x/wk)</div>
                <div class="kpi-value">${weeklyStreak}</div>
                <div class="kpisub">Consecutive Weeks hit</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Active Days</div>
                <div class="kpi-value">${totalDays}d</div>
                <div class="kpisub">${noteEntries.length} journal notes</div>
            </div>
        </section>

        <article class="habit-card" data-theme="${currentTheme}">
            <div class="habit-header">
                <span class="habit-title">${escapeHtml(habit.name)} - 52-Week Grid</span>
                <span class="streak-badge">Click to log • Right-click to write a note</span>
            </div>
            <div id="detail-grid-wrap" class="grid-wrapper"></div>
        </article>

        <article class="habit-card">
            <h2 class="section-heading">Habit Settings &amp; Custom Level Definitions</h2>
            <form id="detail-settings-form">
                <div class="settings-grid">
                    <div class="field-group">
                        <label for="detail-name-input">Habit name</label>
                        <input id="detail-name-input" type="text" maxlength="60" value="${escapeHtml(habit.name)}" required>
                    </div>
                    <div class="field-group">
                        <label for="detail-theme-select">Color Theme</label>
                        <select id="detail-theme-select">${THEMES.map((t) => `<option value="${t} ${t === currentTheme ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}"</option>`).join("")}</select>
                    </div>
                    <div class="field-group">
                        <label for="detail-goal-select">Weekly Goal (Rest-Day Friendly)</label>
                        <select id="detail-goal-select">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${n === weeklyGoal ? "selected" : ""}>${n} day${n === 1 ? "" : "s"} per week</option>`).join("")}</select>
                    </div>
                    <div class="field-group">
                        <label for="lvl-1-input">Level 1 Meaning (Light)</label>
                        <input id="lvl-1-input" type="text" maxlength="40" placeholder="e.g., 15 mins" value="${escapeHtml(levels[1] || "")}">
                    </div>
                    <div class="field-group">
                        <label for="lvl-2-input">Level 2 Meaning (Moderate)</label>
                        <input id="lvl-2-input" type="text" maxlength="40" placeholder="e.g., 30 mins" value="${escapeHtml(levels[2] || "")}">
                    </div>
                    <div class="field-group">
                        <label for="lvl-3-input">Level 3 Meaning (Strong)</label>
                        <input id="lvl-3-input" type="text" maxlength="40" placeholder="e.g., 45 mins" value="${escapeHtml(levels[3] || "")}">
                    </div>
                    <div class="field-group">
                        <label for="lvl-4-input">Level 4 Meaning (Max Effort)</label>
                        <input id="lvl-4-input" type="text" maxlength="40" placeholder="e.g., 60+ mins" value="${escapeHtml(levels[4] || "")}">
                    </div>
                </div>
                <div style="margin-top: 14px;">
                    <button type="submit" class="btn-primary">Save Settings</button>
                </div>
            </form>
        </article>

        <article class="habit-card">
            <h2 class="section-heading">Daily Journal &amp; Notes (${noteEntries.length})</h2>
            <form id="detail-note-form" class="habit-form" style="margin-bottom: 12px;">
                <input id="detail-note-date" type="date" value="${todayKey}" max="${todayKey}" class="detail-select">
                <input id="detail-note-text" type="text" maxlength="240" placeholder="Add a journal note for the selected date..." required>
                <button type="submit" class="btn-primary">Save Note</button>
            </form>
            <div class="journal-list">
                ${noteEntries.length === 0 ? `<p class="streak-badge">No notes yet. Right-click any square on the grid or use the form above.</p>` : noteEntries.map((dateKey) => {
                    const lvl = logs[dateKey] || 0;
                    const lvlDesc = levels[lvl] ? ` (${escapeHtml(levels[lvl])})` : "";
                    return `
                        <div class="journal-entry">
                            <div class="journal-entry-header">
                                <span><strong>${dateKey}</strong> • Level ${lvl}${lvlDesc}</span>
                                <button type="button" class="btn-delete" data-del-note="${dateKey}">Remove</button>
                            </div>
                            <div>${escapeHtml(notes[dateKey])}</div>
                        </div>
                    `;
                }).join("")}
            </div>
        </article>
    `;

    const gridWrap = document.getElementById("detail-grid-wrap");
    const layout = document.createElement("div");
    layout.className = "calendar-layout";
    const grid = document.createElement("div");
    grid.className = "grid";

    for (let i = 0; i < 364; i++) {
        const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        const key = toDateKey(cellDate);
        const level = logs[key] || 0;

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.level = level;

        if (cellDate > today) {
            cell.classList.add("future");
        } else {
            attachCellNoteHandlers(cell, habit, key, level);
            cell.addEventListener("click", () => cycleLevel(habit.id, key));
        }
        grid.appendChild(cell);
    }

    layout.append(buildMonthLabels(startDate), buildWeekdayLabels(), grid);
    gridWrap.appendChild(layout);

    document.getElementById("detail-back-btn").addEventListener("click", () => switchView("grid"));
    document.getElementById("habit-switcher").addEventListener("change", (e) => {
        switchView("habit", e.target.value);
    });
    document.getElementById("detail-log-today").addEventListener("click", () => {
        cycleLevel(habit.id, todayKey);
    });
    document.getElementById("detail-share-png").addEventListener("click", () => exportHabitPng(habit));

    document.getElementById("detail-settings-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const newName = document.getElementById("detail-name-input").value.trim();
        if (newName) habit.name = newName;
        habit.theme = document.getElementById("detail-theme-select").value;
        habit.weeklyGoal = Number(document.getElementById("detail-goal-select").value) || 7;
        habit.levels = {
            1: document.getElementById("lvl-1-input").value.trim(),
            2: document.getElementById("lvl-2-input").value.trim(),
            3: document.getElementById("lvl-3-input").value.trim(),
            4: document.getElementById("lvl-4-input").value.trim()
        };
        save();
    });

    document.getElementById("detail-note-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const dateKey = document.getElementById("detail-note-date").value;
        const text = document.getElementById("detail-note-text").value.trim();
        if (!dateKey || !text) return;
        if (!habit.notes) habit.notes = {};
        habit.notes[dateKey] = text;
        if (!habit.logs[dateKey]) habit.logs[dateKey] = 1;
        save();
    });

    page.querySelectorAll("[data-del-note]").forEach((btn) => {
        btn.addEventListener("click", () => {
            delete habit.notes[btn.dataset.delNote];
            save();
        });
    });
}

// Sub view 3

const HABIT_TEMPLATES = [
    {
        title: "Developer Grind",
        description: "Build daily coding momentum, ship commits, and sharpen problem-solving.",
        habits: [
            {name: "Daily Coding", theme: "green", levels: {1: "20 min", 2: "45 min", 3: "90 min", 4: "2+ hrs deep work"}},
            {name: "Git Commit Streak", theme: "blue", levels: {1: "1 small fix", 2: "Feature progress", 3: "PR / Milestone", 4: "Major release"}},
            {name: "Algorithm & Docs Study", theme: "purple", levels: {1: "1 problem", 2: "2 problems", 3: "3 problems", 4: "Mock interview"}}
        ]
    },
    {
        title: "Fitness & Mobility",
        description: "Balanced strength, daily movement, and recovery without burnout.",
        habits: [
            {name: "Workout / Training", theme: "orange", weeklyGoal: 4, levels: {1: "20 min light", 2: "40 min session", 3: "60 min solid", 4: "PR / Intense"}},
            {name: "10,000 Steps", theme: "green", levels: {1: "5k steps", 2: "7.5k steps", 3: "10k steps", 4: "14k+ Steps"}},
            {name: "Mobility & Stretching", theme: "blue", levels: {1: "5 min", 2: "10 min", 3: "20 min", 4: "Full routine"}}
        ]
    },
    {
        title: "Reading & Deep Study",
        description: "Consistent daily learning for books, courses, and language fluency.",
        habits: [
            {name: "Read 20 pages", theme: "purple", levels: {1: "10 pages", 2: "20 pages", 3: "30 pages", 4: "50+ pages"}},
            {name: "Focused Study Block", theme: "blue", levels: {1: "25 min Pomodoro", 2: "50 min", 3: "90 min", 4: "2+ hrs"}},
            {name: "Language Practice", theme: "pink", levels: {1: "10 min vocab", 2: "20 min lesson", 3: "30 min + listening", 4: "Conversation"}}
        ]
    },
    {
        title: "Mindfulness & Sleep",
        description: "Protect evening wind-down routines, calm focus, and mental clarity.",
        habits: [
            {name: "Morning Meditation", theme: "blue", levels: {1: "5 min", 2: "10 min", 3: "15 min", 4: "20+ min"}},
            {name: "No Screens Before Bed", theme: "purple", levels: {1: "15 min", 2: "30 min", 3: "45 min", 4: "60+ min"}},
            {name: "Gratitude Journal", theme: "pink", levels: {1: "1 line", 2: "3 things", 3: "Full reflection", 4: "Deep review"}}
        ]
    }
];

function addTemplateHabit(item) {
    const exists = habits.some((h) => h.name.toLowerCase() === item.name.toLowerCase());
    if (exists) return false;

    habits.push({
        id: `habit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: item.name,
        theme: item.theme || "green",
        weeklyGoal: item.weeklyGoal || 7,
        levels: item.levels || {},
        logs: {},
        notes: {}
    });
    save();
    return true;
}

function renderTemplateView() {
    const page = document.getElementById("view-templates");
    if (!page) return;

    page.innerHTML = `
        <div id="template-toast" class="toast-banner" hidden></div>
        <section class="templates-grid">
            ${HABIT_TEMPLATES.map((pack, packIdx) => `
                    <article class="template-card">
                        <div>
                            <h2 class="section-heading">${pack.title}</h2>
                            <p class="template-desc">${pack.description}</p>
                            <ul class="template-items">
                                ${pack.habits.map((item, itemIdx) => `
                                    <li>
                                        <span><strong>${item.name}</strong></span>
                                        <button type="button" class="btn-small" data-pack="${packIdx}" data-item="${itemIdx}">+ Add</button>
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                        <button type="button" class="btn-primary" data-add-pack="${packIdx}">Add Pack to My Grid</button>
                    </article> 
                `).join("")}
        </section>
    `;

    const showToast = (msg) => {
        const toast = document.getElementById("template-toast");
        toast.textContent = msg;
        toast.hidden = false;
    };

    page.querySelectorAll("[data-add-pack]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const pack = HABIT_TEMPLATES[Number(btn.dataset.addPack)];
            let added = 0;
            pack.habits.forEach((item) => {
                if (addTemplateHabit(item)) added++;
            });
            showToast(added > 0 ? `Added ${added} habit${added === 1 ? "" : "s"} from "${pack.title}" to your Grid!"` : `All habits from "${pack.title}" are already in your Grid`);
        });
    });

    page.querySelectorAll("[data-pack][data-item]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const item = HABIT_TEMPLATES[Number(btn.dataset.pack)].habits[Number(btn.dataset.item)];
            const added = addTemplateHabit(item);
            showToast(added ? `"${item.name}" to your Grid!` : `"${item.name}" is already in your Grid.`)
        });
    });
}

// Sub view 4

function renderAchievmentsView() {
    const page = document.getElementById("view-achievements");
    if (!page) return;

    let totalLogs = 0;
    let maxStreak = 0;
    let level4Count = 0;
    let consecutiveLevel4 = 0;
    let totalNotes = 0;
    let hasCustomLevels = false;
    let hasArchivedVeteran = false;
    const distinctThemes = new Set();

    habits.forEach((h) => {
        const logs = h.logs || {};
        const notes = h.notes || {};
        const stats = calculateStats(logs);
        totalLogs += stats.totalDays;
        if (stats.bestStreak > maxStreak) maxStreak = stats.bestStreak;
        distinctThemes.add(THEMES.includes(h.theme) ? h.theme : "green");

        if (h.archived && stats.totalDays >= 14) hasArchivedVeteran = true;
        if (h.levels && Object.values(h.levels).some((v) => v && v.trim() !== "")) hasCustomLevels = true;
        totalNotes += Object.values(notes).filter((v) => v && v.trim() !== "").length;

        const lvl4Keys = Object.keys(logs).filter((k) => logs[k] === 4).sort();
        level4Count += lvl4Keys.length;
        let run4 = 0;
        let prev4 = 0;
        lvl4Keys.forEach((k) => {
            const curr = parseDateKey(k);
            run4 = prev4 && Math.round((curr - prev4) / 86400000) === 1 ? run4 + 1 : 1;
            if (run4 > consecutiveLevel4) consecutiveLevel4 = run4;
            prev4 = curr;
        });
    });

    const badges = [
        {icon: "🌱", title: "First Step", desc: "Log your first habit square.", current: Math.min(1, totalLogs), target: 1},
        {icon: "🔥", title: "Week Warrior", desc: "Reach a 7-day streak on any habit.", current: Math.min(7, maxStreak), target: 7},
        {icon: "🏆", title: "Unstoppable Month", desc: "Reach a 30-day streak on any habit.", current: Math.min(30, maxStreak), target: 30},
        {icon: "💯", title: "Century Club", desc: "Log 100 total active days across habits.", current: Math.min(100, totalLogs), target: 100},
        {icon: "🗓️", title: "Year in Pixels", desc: "Log 365 total active days across habits.", current: Math.min(365, totalLogs), target: 365},
        {icon: "⚡", title: "Max Effort", desc: "Log a Level 4 intensity square.", current: Math.min(1, level4Count), target: 1},
        {icon: "💎", title: "Perfect Week", desc: "Log 7 consecutive days at Level 4.", current: Math.min(7, consecutiveLevel4), target: 7},
        {icon: "🧱", title: "Habit Architect", desc: "Track 3 or more active habits at once.", current: Math.min(3, habits.filter((h) => !h.archived).length), target: 3},
        {icon: "🎨", title: "Full Spectrum", desc: "Use all 5 theme colors across your habits.", current: Math.min(5, distinctThemes.size), target: 5},
        {icon: "📝", title: "Storyteller", desc: "Write 5 daily square notes.", current: Math.min(5, totalNotes), target: 5},
        {icon: "🎯", title: "Custom Crafted", desc: "Define custom Level 1-4 targets for a habit.", current: hasCustomLevels ? 1 : 0, target: 1},
        {icon: "📦", title: "Finisher", desc: "Archive a habit with at least 14 logged days.", current: hasArchivedVeteran? 1 : 0, target: 1}
    ];

    const unlockedCount = badges.filter((b) => b.current >= b.target).length;

    page.innerHTML = `
        <div class="kpi-card" style="margin-bottom: 20px;">
            <div class="kpi-label">Achievements Progress</div>
            <div class="kpi-value">${unlockedCount} / ${badges.length} Unlocked</div>
            <div class="progress-track" style="margin-top: 10px;">
                <div class="progress-fill" style="width: ${Math.round((unlockedCount / badges.length) * 100)}%;"></div>
            </div>
        </div>

        <section class="achievements-grid">
            ${badges.map((b) => {
                const unlocked = b.current >= b.target;
                const pct = Math.round((b.current / b.target) * 100);
                return `
                    <article class="badge-card ${unlocked ? "unlocked" : ""}">
                        <div class="badge-top">
                            <span class="badge-icon" aria-hidden="true">${b.icon}</span>
                            <div>
                                <strong>${b.title}</strong>
                                <div class="badge-status">${unlocked ? "UNLOCKED" : `${b.current} / ${b.target}`}</div>
                            </div>
                        </div>
                        <p class="template-desc" style="margin-bottom: 10px;">${b.desc}</p>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${pct}%;"></div>
                        </div>
                    </article>
                `;
            }).join("")}
        </section>
    `;
}

function refreshactiveView() {
    if (currentView === "stats") renderStatsView();
    if (currentView === "habit") renderHabitDetailView();
    if (currentView === "templates") renderTemplateView();
    if (currentView === "achievements") renderAchievmentsView();
}

// Shortcuts

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeNoteModal();
        return;
    }

    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        switchView("grid");
        const input = document.getElementById("habit-input");
        if (input) input.focus();
    } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleAppearance();
    } else if (event.key === "?") {
        event.preventDefault();
        switchView("about");
    }
});

const baseSave = save;
save = function () {
    baseSave();
    refreshactiveView();
};

const prevRender = render;
render = function () {
    prevRender();
    enhanceIndexCards();
};

render();