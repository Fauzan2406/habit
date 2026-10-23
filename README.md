# 🌱 Habit Garden

A cozy, responsive habit tracker built with **HTML, CSS, and vanilla JavaScript**. Grow your virtual garden by checking in on daily habits.

## Features
- Create, edit, and delete habits
- Track daily check-ins and current streaks
- Daily completion stats and weekly chart
- Calendar view with activity indicators
- Insights by habit category
- Virtual garden responds to today's completion progress
- Light/dark theme
- Responsive desktop, tablet, and mobile layouts
- Persistent data with `localStorage`
- No backend, build tools, or package installation required

## Run locally
1. Download or clone this repository.
2. Open `index.html` in your browser, or use VS Code with the Live Server extension.
3. Your habit data is stored in the current browser.

## Deploy to GitHub Pages
1. Create a GitHub repository, e.g. `habit-garden`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for deployment. Your site will be available at `https://YOUR-USERNAME.github.io/habit-garden/`.

## Notes
- Data is stored in the browser using `localStorage`; it is not synced between devices.
- Google Fonts are loaded from a CDN, so the font styling requires an internet connection. The app itself works without a backend.
- Calendar and streaks use the user's local date.
- This is a portfolio/demo project, not a cloud-synced account system.

## Project structure
```text
habit-garden/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## License
You can use and adapt this project for your personal portfolio.
