# 🎬 Slate

**A free, offline screenwriting app.** Write screenplays in proper industry format, with everything stored as plain files on your own computer — no accounts, no cloud, no subscriptions.

Slate is fully bilingual (English / Spanish) and exports to industry-standard PDF (A4, Courier Prime, correct margins and pagination).

> Made by a single hobbyist screenwriter. v1.0 — feedback very welcome!

---

## ✨ Features

- **Automatic screenplay formatting** — scene headings, action, character, dialogue, parenthetical, transition. Tab and Enter behave like in professional tools.
- **Smart autocomplete** — INT./EXT. prefixes, time of day, character names, transitions, and automatic `(CONT'D)` / `(MORE)`.
- **Real A4 pagination on screen** — what you see matches the exported PDF, page for page.
- **Export** to PDF, Word (.docx) and Fountain. **Import** from Fountain.
- **Your files, your folder** — each script is a `.slate` file in a folder you choose. Double-click a `.slate` to open it.
- **Scene panel** (drag to reorder), **index cards** view, **per-line notes**, **statistics**, **search** (Ctrl+F).
- **Undo / Redo**, **autosave**, **spell check** (follows your language).
- **Dark / light mode**, bilingual **English / Spanish** interface.
- 100% **offline**. Your work never leaves your computer.

## 📥 Download & install

Go to the [**Releases**](../../releases) page and download the installer for your system:

- **Windows** — `Slate Setup x.x.x.exe`
- **macOS** — `Slate-x.x.x.dmg`

> ⚠️ The app isn't code-signed (that costs money), so your system may warn you the first time:
> - **Windows:** "Windows protected your PC" → *More info* → *Run anyway*.
> - **macOS:** right-click the app → *Open* → *Open*.
>
> It's safe — it's just unsigned. The full source code is right here for you to inspect.

## 🖼️ Screenshots

_(coming soon)_

## 🛠️ Build from source

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run electron:dev   # run in development
npm run dist           # build the installer for your OS (into ./instalador)
```

## 🧱 Built with

React + Vite, Electron, jsPDF, docx, Courier Prime font.

## 📄 License

[MIT](LICENSE) — free to use, modify and share.

## 🙌 Contributing

Issues and pull requests are welcome. This is a personal project, so responses may take a little while — thanks for your patience!
