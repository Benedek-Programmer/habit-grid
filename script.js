const STORAGE_KEY = "habitgrid_data_v1";

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
    container.innerHTML = "";

    if (habits.length === 0) {
        container.innerHTML(`<p class="empty-state">No habits yet. Add one above to generate your first grid.</p>`);
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
        const card = document.createElement("article");
        card.className = "habit-card";

        const header = document.createElement("div")
        header.className = "habit-header";

        const title = document.createElement("span");
        title.className = "habit-title";
        title.textContent = habit.name;

        const actions = document.createElement("div");
        actions.className = "habit-actions";

        const streak = document.createElement("span");
        streak.className = "streak-badge";
        const days = calculateStreak(habit.logs);
        streak.innerHTML = `Streak: <strong>${days} ${days === 1 ? "day" : "days"}</strong>`;

        const logTodayBtn = document.createElement("button");
        logTodayBtn.className = "btn-small";
        logTodayBtn.textContent = "+ Log Today";
        logTodayBtn.addEventListener("click", () => cycleLevel(habit.id, toDayKey));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.title = "Delete habit";
        deleteBtn.addEventListener("click", () => deleteHabit(habit.id));

        actions.append(streak, logTodayBtn, deleteBtn);
        header.append(title, actions);

        const wrapper = document.createElement("div");
        wrapper.className = "grid-wrapper";

        const grid = document.createElement("div");
        grid.className = "grid";

        for (let i = 0; i < 364; i++) {
            const cellDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const key = toDateKey(cellDate);
            const level = habit.logs[key] || 0;
            
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

        wrapper.appendChild(grid);
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