# Neon Tic-Tac-Toe

A responsive, modern Tic-Tac-Toe game built with **HTML, CSS, and vanilla JavaScript**. No framework, build tools, backend, or API keys required.

## Features

- Play against the AI or a friend on the same device
- Three AI difficulty levels: Beginner, Intermediate, and Expert
- Expert AI uses minimax with alpha-beta pruning
- Responsive neon-inspired UI for desktop, tablet, and mobile
- Continuous rematches until you choose to stop; a session summary announces the overall winner
- Scoreboard, win rate, match history, and achievement messages
- Win-line highlights, animated moves, optional sound effects
- Keyboard shortcuts: press **1–9** to select a board cell; **Esc** closes the result dialog
- Works as a static website, ready for GitHub Pages

## Run locally

Open `index.html` in a modern browser. For the most reliable local preview, you can also use VS Code's Live Server extension.

## Publish with GitHub Pages

1. Create a new repository on GitHub, for example `neon-tic-tac-toe`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the **root** of the repository.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for the Pages deployment to finish. Your site URL will look like:
   `https://YOUR-USERNAME.github.io/neon-tic-tac-toe/`

If you use a different repository name, the URL will use that name. The Google Fonts import is optional; the page falls back to system fonts if it is unavailable.

## Project files

- `index.html` — page structure
- `style.css` — theme, responsive layout, and animations
- `script.js` — game rules, AI, sound, scoreboard, and interactions

## Notes

- Scores are kept for the current browser session and reset when the page is refreshed.
- This is a client-side game; no server is needed.
"# Tic-Tac-Toe" 
