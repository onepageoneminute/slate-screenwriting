# 🎬 Slate

[![Latest release](https://img.shields.io/github/v/release/onepageoneminute/slate-screenwriting?label=download)](https://github.com/onepageoneminute/slate-screenwriting/releases/latest)
[![Total downloads](https://img.shields.io/github/downloads/onepageoneminute/slate-screenwriting/total?label=downloads)](https://github.com/onepageoneminute/slate-screenwriting/releases)
[![Stars](https://img.shields.io/github/stars/onepageoneminute/slate-screenwriting?style=flat)](https://github.com/onepageoneminute/slate-screenwriting/stargazers)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue)](LICENSE)

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

## ⌨️ How to use

Slate formats your script as you type — you focus on writing.

**Writing flow**
- **Enter** → creates the next logical element (after a character → dialogue, after dialogue → a new character, etc.).
- **Tab** → changes the current line's type, smartly (character → parenthetical → dialogue…). On an empty character line, Tab → action.
- **Ctrl/Cmd + 1…6** → set the line type directly: `1` Scene heading · `2` Action · `3` Character · `4` Dialogue · `5` Parenthetical · `6` Transition.
- In a scene heading, start typing `INT` / `EXT` for prefix + time-of-day suggestions. Character names autocomplete too, and `(CONT'D)` is added automatically.
- **Click anywhere on the page** to place the cursor, just like a word processor.

**Bottom toolbar** — the six element types; click to change the current line (shows the `⌃1…⌃6` shortcuts).

**Top bar** — switch **Script / Cards** view · **Title page** editor · **Statistics** · **Export** (PDF / Word / Fountain) · light/dark toggle · **⚙ settings** (scene numbers, font size, bold, etc.) · **New**.

**Side panel** — list of scenes: drag to reorder, see the characters in each scene, click to jump there.

**Notes** — hover a line and click the 🗨 icon to attach a private note (it won't be printed).

**Handy shortcuts** — `Ctrl/Cmd+F` search · `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Y` redo.

**Home screen** — organize scripts into folders (drag a card onto a folder) · create a **New project** · **Import** a Fountain file · drag `.slate` files in to add them · choose the **interface language** and **spell-check language** · pick the folder where your scripts live.

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
npm run dist           # build the installer for your OS (into ./release)
```

## ⚠️ Known limitations (v1.0)

This is an early version built by one person. Things that are good to know:

- **Not code-signed** — Windows (SmartScreen) and macOS (Gatekeeper) will warn you on first launch. It's safe; see the install notes above.
- **macOS build is Apple Silicon (arm64) only** for now — Intel Macs aren't covered yet.
- **An extremely long paragraph (more than a full page with no line breaks) can overflow** instead of splitting across pages — just break it into smaller paragraphs. Rare with normal screenplay formatting. **If you'd like to fix it properly, you're free to — PRs welcome!**
- **Very large scripts (300+ pages)** can feel less snappy while typing. Feature-length scripts (~120 pages) run smoothly.
- **Interface is English & Spanish only** (the spell-checker supports many more languages).
- **No cloud, no sync, no auto-update — by design.** Back up your scripts folder yourself, and grab new versions from the Releases page.

Anyone is welcome to improve any of these — that's what open source is for. 🙌

## 🧱 Built with

React + Vite, Electron, jsPDF, docx, Courier Prime font.

## 📄 License

[GNU GPLv3](LICENSE) — a copyleft license. You're free to use, study, modify and
share Slate. The catch (on purpose): **any version you distribute must also be free
and open source under the same license.** Slate stays free for everyone, forever.

## 🙌 Contributing — and the one rule

If you know how to code, you're **very welcome** to improve Slate: fix bugs, add features, translate it, make it better for everyone. Issues and pull requests are welcome (responses may take a little while — thanks for your patience!).

There's just **one rule**, and it's the whole point of this project:

> **Slate must stay free and accessible to everyone — forever.**
> Build on it, improve it, share it... but anything you make from it has to remain free and open too. No closing it off, no selling it as your own.

That's not just a wish — it's enforced by the license above.
