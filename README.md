# CellMate

Hire an AI worker that has its own cell phone. CellMate's agent gets a full phone (Phone, Messages, Camera, Maps, Contacts, Browser, Calendar) and does the calling, texting and booking for a small business, then sends the owner a report. It always says it's an AI and never spends money without the owner's OK.

This repo is the interactive demo: pick a job (or type one) and watch the agent work its phone, with a timestamped log and a job report. Calls and texts are simulated; all names and numbers are fictional (555 numbers). A production version would connect a real phone line and a voice AI.

## Files
- `index.html` – page
- `src/main.js`, `src/style.css` – demo logic and styles

Plain static files with relative paths, no build step needed (works on GitHub Pages). `package.json` lets you run it with Vite locally (`npm i && npm run dev`) if you prefer.

Created by Walter Henderson Jr.
