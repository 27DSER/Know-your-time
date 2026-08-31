# AGENTS.md / CODEX.md - Know Your Time (HKDSE Past Paper Timer)

## 📌 Project Overview
**Know Your Time** is a high-precision, single-file web application built for HKDSE students to time their past paper practice, log per-question split times, skip difficult questions, exclude outlier timing from average pace calculations, and export comprehensive paper analytics to CSV/TSV format.

- **Local Path**: `/Users/chowhoching/.gemini/antigravity/scratch/dse-past-paper-timer`
- **GitHub Repo**: `https://github.com/27DSER/Know-your-time`
- **Live Site**: `https://27dser.github.io/Know-your-time/`

---

## 🎨 Architectural & Design Rules

1. **Single-File Standalone Architecture**:
   - The entire web application is self-contained in `index.html`.
   - **Zero External Dependencies**: All CSS styling and JavaScript logic are embedded inline. No build tools, npm packages, or external CDNs required. Works 100% offline.
2. **Pure Monochrome Apple Aesthetic**:
   - Stark, ultra-minimalist design language.
   - Dark Mode: Pure OLED black (`#000000`), frosted glass containers (`backdrop-filter: blur(30px)`), stark white text.
   - Light Mode: Off-white canvas (`#fbfbfd`), clean neutral grey borders.
   - **Typography**: `-apple-system, SF Pro Display, SF Pro Text`, utilizing tabular numbers (`font-variant-numeric: tabular-nums`) to prevent clock jitter.
3. **High-Precision Timing Engine**:
   - Uses `performance.now()` delta calculations to prevent browser tab timer drift during long practice sessions.
4. **Web Audio & Storage APIs**:
   - Synthesizes audio alert tone via native `AudioContext` (no external audio files).
   - Retains session history locally via `localStorage`.

---

## ⚡ Key Features & Keyboard Shortcuts

- **Modes**: Count Up (Stopwatch) & Count Down (Timer with HH:MM:SS input).
- **Question Laps**:
  - <kbd>Space</kbd> : Start / Pause
  - <kbd>Enter</kbd> / <kbd>L</kbd> : Next Question (Log Split Time)
  - <kbd>S</kbd> : Skip Question (Logs split, tags as `[Skipped]`, excludes duration from mean pace calculation)
  - <kbd>R</kbd> : Reset Session
- **Custom Question Tags**: Dropdown schemes (`Q1, Q2...`, `MC 1, MC 2...`, `Part A Q1...`, `Section B Q1...`) + inline click-to-edit renaming.
- **Outlier Mean Exclusion**: Per-lap `[In Mean]` / `[Excluded]` badge toggle.
- **Session Analytics & Export**: Full analytics modal (Fastest Q, Slowest Q, Completion Rate, Mean Pace) + dual-section CSV download & TSV clipboard copier.

---

## 📁 Repository File Tree

```
/dse-past-paper-timer/
├── index.html        # Main standalone HTML5 app (CSS + JS inline)
├── app_icon.jpg      # Minimalist Apple squircle app icon & favicon
├── README.md         # Full user tutorial & device installation guide
├── LICENSE           # Open-source MIT License
└── CODEX.md          # Agent & Codex system instruction guide
```
