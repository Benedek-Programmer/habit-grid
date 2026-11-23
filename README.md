# HabitGrid

A lightweight, 100% local-first habit tracker inspired by GitHub contribution graphs. Track daily consistency and effort intensity across 52-week heatmaps with zero accounts, zero backend servers, and zero external dependencies.

---

## Features

### 52-Week Contribution Heatmaps & Customization

* **5-Level Intensity Tracking:** Click any square on the 364-day grid to cycle through **Levels 0 to 4**, letting you distinguish between light sessions (Level 1) and peak effort (Level 4).


* **5 Habit Color Themes:** Personalize individual habits with **Emerald Green**, **Ocean Blue**, **Royal Purple**, **Sunset Orange**, or **Rose Pink** palettes.


* **Dark & Light Mode:** Switch seamlessly between dark and light UI themes at any time from the header or via keyboard shortcut.


* **Today Quick Check-In Bar:** Log or cycle today's intensity level for all active habits from a single pill bar at the top of the Grid view.


* **Drag-and-Drop Reordering & Archiving:** Reorder habit cards using the `⋮⋮` drag handle, or archive completed habits to keep your main grid focused without losing historical data.



### Multi-View Dashboard

* **Grid (`grid`):** Your primary workspace for creating habits, logging daily squares, reordering cards, and managing archived habits.


* **Analytics (`stats`):** View high-level KPI cards (Active Habits, Total Check-Ins, All-Time Best Streak, and 30-Day Consistency), a **Combined 52-Week Master Heatmap**, a **Completions by Day of Week** bar chart, and a per-habit breakdown table.


* **Habit Deep-Dive (`habit`):** Click any habit title or **Details** button to configure custom meanings for Levels 1–4, set rest-day-friendly **Weekly Goals** (1–7 days per week), and browse all journal notes for that habit.


* **Templates (`templates`):** Jump-start your routine with one-click starter packs—**Developer Grind**, **Fitness & Mobility**, **Reading & Deep Study**, and **Mindfulness & Sleep**—complete with pre-configured themes, weekly goals, and level definitions.


* **Achievements (`achievements`):** Unlock 12 milestone badges (such as *Week Warrior*, *Century Club*, *Year in Pixels*, *Perfect Week*, and *Full Spectrum*) tracked automatically from your habit logs.


* **Guide (`about`):** Built-in reference covering streak rules, keyboard shortcuts, and local-first privacy.



### Daily Journal Notes, PNG Snapshots & Backups

* **Square Journal Notes:** Right-click (or long-press on touch devices) any past or current square to attach a note of up to 240 characters. Squares containing notes display a highlighted border and preview the note on hover.


* **Retina PNG Export (`Share PNG`):** Generate and download a 2x-scaled PNG snapshot of any habit's 52-week grid, theme colors, and streak stats rendered directly via the HTML5 `<canvas>` API.


* **Portable JSON Backup:** Export your entire habit history to a dated `.json` file and restore it on any browser using **Import**.



---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| N | Jump to the **Grid** view and focus the new habit input

 |
| T | Toggle between **Light Mode** and **Dark Mode**

 |
| ? | Open the **Guide & Privacy** view

 |
| Esc | Close the daily square note modal

 |
| Right-Click on square | Add, edit, or delete a daily journal note for that date

 |

---

## Tech Stack & Project Structure

HabitGrid is built entirely with standard web technologies—no frameworks, bundlers, or build steps required:

```text
habit-grid/
├── index.html   # App shell, navigation, views, and Guide documentation[cite: 3]
├── style.css    # Theme variables, responsive layouts, grids, modals, and charts[cite: 5]
└── script.js    # State management, localStorage persistence, Canvas PNG export, and view renderers[cite: 4]

```

---

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/Benedek-Programmer/habit-grid.git
cd habit-grid

```


2. **Launch the app:**
Open `index.html` directly in any modern web browser, or serve the folder with any static file server (e.g., VS Code Live Server or `npx serve .`).



---

## Data Storage & Privacy

* **100% Local Storage:** HabitGrid makes zero network requests and uses no analytics or tracking scripts.


* **Browser Persistence:** Habit data, custom level labels, weekly goals, and journal notes are stored under `habitgrid_data_v1` in `localStorage`, while your Light/Dark mode preference is saved under `habitgrid_appearance_v1`.


* **Backups:** Because clearing browser site data will erase `localStorage`, use the **Export** button in the top-right header regularly to keep a local `.json` backup.



---

## License

This project is open source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
