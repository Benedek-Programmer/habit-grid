# HabitGrid

A lightweight, 100% local-first habit tracker. It tracks daily consistency and effort intensity using 52-week heatmaps. No accounts, no backend servers, no external dependencies. Inspired by GitHub contribution graphs.

---

## Features

### 52-Week Contribution Heatmaps & Customization

* **5 Intensity Levels:** Click on any square of the 364-day grid to toggle between **Levels 0 to 4** intensity levels. Helps you distinguish between light sessions (Level 1) and peak effort (Level 4).


* **5 Habit Color Themes:** Customize each habit's color scheme with either **Emerald Green**, **Ocean Blue**, **Royal Purple**, **Sunset Orange**, or **Rose Pink** palettes.


* **Dark & Light Mode:** Seamlessly toggle between dark and light UI themes anytime from the header or keyboard shortcut.


* **Today Quick Check-In Bar:** Quickly log or toggle today's intensity level for all active habits from a single pill bar at the top of the Grid view.


* **Drag & Drop Reordering & Archiving:** Easily reorder habit cards with `⋮⋮` drag handle. Archive finished habits to keep your main grid clean, but preserve historical data.



### Multi-View Dashboard

* **Grid (`grid`):** Your main workspace. Create habits, log daily squares, reorder cards, manage archived habits.


* **Analytics (`stats`):** High level KPI cards (Active Habits, Total Check-Ins, All-Time Best Streak, 30-Day Consistency), **Combined 52-Week Master Heatmap**, **Completions by Day of Week** bar chart, habit-by-habit breakdown table.


* **Habit Deep-Dive (`habit`):** Click on any habit title or **Details** button to configure custom meanings for Level 1-4, set rest-day-friendly **Weekly Goals** (1-7 days/week), see all journal notes for this habit.


* **Templates (`templates`):** Get started quickly with one-click starter packs: **Developer Grind**, **Fitness & Mobility**, **Reading & Deep Study**, **Mindfulness & Sleep**. Pre-configured with themes, weekly goals, and level definitions.


* **Achievements (`achievements`):** 12 milestone badges to unlock (e.g. *Week Warrior*, *Century Club*, *Year in Pixels*, *Perfect Week*, *Full Spectrum*). Automatically tracked from your habit logs.


* **Guide (`about`):** Built-in reference. Streak rules, keyboard shortcuts, local-first privacy.



### Daily Journal Notes, PNG Snapshots & Backups

* **Square Journal Notes:** Right click (long press on touch devices) on any past/current square to add up to 240 char note. Squares with notes will have highlighted border and hover preview for the note.


* **Retina PNG Export (`Share PNG`):** Generate and download 2x scaled PNG snapshot of any habit's 52-week grid, theme colors, streak stats. Rendered directly via HTML5 `<canvas>` API.


* **Portable JSON Backup:** Export your entire habit history into dated `.json` file. Restore it on any browser using **Import**.



---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| N | Jump to **Grid** view and focus new habit input

 |
| T | Toggle **Light Mode** / **Dark Mode**

 |
| ? | Open **Guide & Privacy** view

 |
| Esc | Close daily square note modal

 |
| Right-Click on square | Add/edit/delete daily journal note on this date

 |

---

## Tech Stack & Project Structure

HabitGrid is built entirely on standard web technologies. No frameworks, no bundlers, no build steps.

```text
habit-grid/
├── index.html   # App shell, navigation, views, Guide documentation[cite: 3]
├── style.css    # Theme variables, responsive layouts, grids, modals, charts[cite: 5]
└── script.js    # State management, localStorage persistence, Canvas PNG export, view renderers[cite: 4]

```

---

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/Benedek-Programmer/habit-grid.git
cd habit-grid

```


2. **Run the app:**
Open `index.html` directly in any modern browser. Or serve the folder with any static file server (e.g. VS Code Live Server, `npx serve .`).



---

## Data Storage & Privacy

* **100% Local Storage:** HabitGrid makes zero network requests. No analytics or tracking scripts used.


* **Browser Persistence:** Habit data, custom level labels, weekly goals, journal notes are stored in `localStorage` under `habitgrid_data_v1`. Your Light/Dark mode preference is stored under `habitgrid_appearance_v1`.


* **Backups:** If you clear browser site data, `localStorage` will be wiped. So make sure to use **Export** button in top-right header to create local `.json` backup regularly.



---

## License

This project is open source and available under [MIT License](https://www.google.com/search?q=LICENSE).
