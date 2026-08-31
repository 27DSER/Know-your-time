# Know Your Time — Project Handoff and Fix Plan

## Repair status — 2026-08-26

The local repair described in this handoff has now been implemented and checked in this folder:

- Timer states, one-time saving, complete-duration reporting, session recovery, safe exports, responsive layout, accessibility improvements, and English/繁體中文 support are implemented in index.html.
- The repeatable checks are in tests/timer-core.test.cjs; the short device checklist is in TESTING.md.
- This folder is still not connected to GitHub. The remaining release task is a safe remote comparison, repair branch creation, publication, and live-site verification. Do not overwrite the remote project during that comparison.

## Purpose

This document gives a new development chat the complete context needed to repair and harden **Know Your Time**, an HKDSE past-paper timer. It was produced from a repository-wide audit on 2026-08-26. Treat the findings below as the initial backlog; verify each fix with a focused regression test before changing the next item.

## Product summary

- **Product:** Know Your Time / HKDSE Past Paper Timer
- **Audience:** HKDSE students timing past-paper practice
- **Current implementation:** static HTML/CSS/JavaScript in `index.html`, with `app_icon.jpg`
- **Intended capabilities:** count-up and count-down timing, question laps, skip tracking, mean-exclusion controls, editable question labels, analytics, CSV/TSV export, theme toggle, and local history
- **Design direction:** monochrome, Apple-inspired interface; no build tool or network runtime dependency

## Repository state

Current folder: `/Users/chowhoching/Documents/DSE TIMER APP`

Visible files:

```
index.html       Application source
app_icon.jpg     Header/favicon/touch icon
README.md        User-facing setup and feature guide
LICENSE          MIT License
AGENTS.md        Project instructions (duplicate)
CLAUDE.md        Project instructions (duplicate)
CODEX.md         Project instructions (duplicate)
.DS_Store        Finder metadata
```

Important setup observations:

1. This folder is **not currently a Git repository**. `git status` reports “Not a git repository”. Initialise or clone the intended repository before making release-oriented changes.
2. There is no `.gitignore`; `.DS_Store` should be ignored rather than committed.
3. `AGENTS.md`, `CLAUDE.md`, and `CODEX.md` are byte-for-byte identical. Keep one source of truth or clearly document why all three are needed.
4. Those instruction files name a stale local path: `/Users/chowhoching/.gemini/antigravity/scratch/dse-past-paper-timer`.
5. The project describes itself as a “single-file” application, but `index.html` relies on `app_icon.jpg`. Either embed the icon or describe it as a dependency-free static app instead.
6. There are no automated tests, linting configuration, CI workflow, web manifest, or service worker.

## Confirmed application defects

### P1 — Countdown expiry is not terminal and can create duplicate history

Relevant code: `index.html` around `tick()`, `pauseTimer()`, and `resetTimer()`.

At zero, the countdown calls `pauseTimer()`. That leaves `state` as `paused`, labels the main button **Resume**, and keeps the Next Q/Skip Q controls enabled. Pressing Resume reaches zero again, which repeats the beep and history save. Pressing Reset after expiry also saves the already-saved session a second time.

Reproduction confirmed with the real embedded JavaScript:

1. Start a one-second countdown.
2. Record one lap before it reaches zero.
3. Let the timer expire — history contains one session.
4. Press Reset — history contains two identical sessions.
5. Alternatively, press Resume at zero — expiry handling runs again and saves another session.

Required fix direction:

- Add a distinct terminal state such as `finished`, or reset to a clearly intentional state.
- Disable lap/skip controls when the countdown is not running.
- Save a session through one idempotent completion path only.
- Ensure Resume cannot restart an expired countdown unless the user explicitly starts a new session.

Acceptance checks:

- Expired countdown shows a terminal UI, not Resume.
- Reset after expiry does not add another history item.
- Repeated clicks cannot create duplicate history entries.
- Next Q and Skip Q cannot add laps after time-up.

### P1 — Saved duration ignores unrecorded time after the final lap

Relevant code: `getAnalyticsData()` and `saveSessionToHistory()` use `lastLapTotalTimeMs`.

The app labels this value as **Total Duration**, but it records only the elapsed time of the most recent lap. Time spent after the final recorded question is lost from analytics, history, and exports.

Confirmed reproduction:

1. Start count-up mode.
2. Record a lap at 1 second.
3. Continue to 5 seconds and reset.
4. Timer showed `00:00:05.0`; saved history duration was `00:00:01`.

Required fix direction:

- Define one authoritative `currentElapsedMs()` helper for both modes.
- Use the real elapsed time when creating session-level analytics/history/export.
- Decide whether ending a session should automatically create a final lap for time since the previous question. Document the chosen behaviour.

Acceptance checks:

- A session ending after its last lap retains its full timer duration.
- Count-up and countdown histories report the correct final duration.
- Analytics and CSV use the same total-duration value.

### P1 — Countdown alarm is unreliable in background tabs and may be blocked

Relevant code: `tick()` is driven entirely by `requestAnimationFrame()`; `playBeep()` constructs the first `AudioContext` only after expiry.

Most browsers pause `requestAnimationFrame()` callbacks in background tabs. The timer can catch up visually on return because it uses `performance.now()`, but zero detection, the alarm, modal, and automatic save can be delayed until the app becomes visible again. Browser audio autoplay rules can also suspend a context first created by an asynchronous expiry callback.

Required fix direction:

- Keep `requestAnimationFrame()` for display updates, but use a separate deadline/visibility strategy for completion.
- Create and unlock/reuse the audio context from a user gesture such as Start.
- Gracefully handle unsupported or blocked audio.
- Be explicit in the product copy about unavoidable browser/OS limitations when a device is locked or a tab is fully suspended.

Acceptance checks:

- Returning from a background tab immediately resolves an expired countdown once, with no duplicate save.
- Audio failure does not crash the timer and provides a visible time-up indication.
- Audio context is reused and unlocked by user interaction where supported.

### P1 — Changing mode while paused mislabels the saved session

Relevant code: the Count Up/Count Down mode click handlers set `mode` before calling `resetTimer()`, while `resetTimer()` saves the previous session.

Example: pause a Count Up session, then click Count Down. The old session is stored as **Count Down** because the global mode was changed before it was saved.

Required fix direction:

- Save the old session before changing mode, or pass an immutable session mode into the saving function.

Acceptance checks:

- A paused Count Up session remains Count Up in history after switching to Count Down.
- The reverse direction also remains correct.

## P2 — Data quality, safety, and interaction defects

### Laps can be recorded while paused

`recordQuestion()` only rejects the `idle` state. The Lap and Skip buttons stay enabled after `pauseTimer()`, so clicking them while paused records the paused duration; additional clicks can create zero-duration laps.

Fix: only allow recording in `running` state and set button disabled state from a single UI-state renderer.

### Skipped questions can be re-included in the mean

Skipping initially sets `excludeFromMean: true`, but the generic mean-toggle button lets the user reverse it. This contradicts the documented promise that skipped questions are excluded from average pace.

Fix: either make skipped laps permanently excluded, or explicitly rename/document the option if inclusion is intended.

### `MC 1` label format produces `MC1`

The option advertises `MC 1, MC 2…`, while label generation concatenates the prefix and number without a space.

Fix: use an explicit pattern formatter rather than string concatenation.

### Unsafe rendering and malformed exports from custom tags

Edited tags are inserted directly into `innerHTML` and interpolated into analytics HTML. They are also inserted into CSV and TSV without escaping.

Impact:

- Tags containing HTML can break the table or execute local script in the page.
- Quotes, commas, tabs, or newlines can corrupt exports.
- Spreadsheet formula prefixes (`=`, `+`, `-`, `@`) can be interpreted by spreadsheet software.

Fix:

- Render text through `textContent` or DOM nodes rather than HTML string interpolation.
- Add proper CSV escaping: quote fields, double embedded quotes, and protect formula-prefixed values.
- Sanitize or encode TSV tabs/newlines consistently.

### Local storage failures can break essential controls

`JSON.parse(localStorage.getItem(...))` and `localStorage.setItem(...)` have no `try/catch` or schema validation. A corrupt value, storage quota error, privacy restriction, or disabled storage can break History, Reset, or automatic completion saving.

Confirmed reproduction: storing invalid JSON causes the History action to throw a `SyntaxError`.

Fix:

- Centralise storage reads/writes behind safe helpers.
- Validate parsed history is an array of expected entries.
- Show a toast when persistence is unavailable, while allowing the timer/reset controls to continue.

### Clipboard copy has no fallback or rejection handling

`navigator.clipboard.writeText()` is called without checking that `navigator.clipboard` exists and without `.catch(...)`. Unsupported or denied clipboard writes produce a failure with no user-facing recovery.

Fix: feature-detect the API, catch rejection, and offer a temporary textarea/manual-copy fallback.

### Mobile layout is not responsive

There are no CSS media queries. On narrow screens, the 5rem timer, fixed-width countdown fields, and title plus three export buttons do not have a wrapping/stacking layout.

Fix: add and visually test breakpoints around 320px, 375px, and 768px. Reduce clock size, stack/wrap action controls, and make tables horizontally scrollable where needed.

### Accessibility gaps

- Modal overlays lack dialog semantics, focus trapping, Escape handling, and focus restoration.
- Input labels are not associated with their inputs using `for`/`id`.
- Global keyboard shortcuts hijack Enter/Space even when a button has focus, preventing normal keyboard activation.
- Theme/mode controls lack state exposed to assistive technology.
- Toast does not use an `aria-live` region.

## Documentation and product-copy corrections

- Clarify that the app’s core works without a network connection when opened locally, but the GitHub Pages site is not available offline without a service worker/cache.
- Do not promise a fullscreen Home Screen app without testing and implementing the appropriate web-app metadata/manifest for the target platforms.
- Update the local path and repository tree in all project instruction files.
- Decide whether history is expected to persist only when the session is reset/finishes. The current app loses a running or paused count-up session if the page is closed.

## Recommended implementation order

1. Establish a tiny regression-test harness for the timing state machine before editing logic.
2. Fix the state model: `idle`, `running`, `paused`, `finished`; centralise control enablement.
3. Centralise elapsed-time calculation and session finalisation; make history saving idempotent.
4. Fix mode-switch save ordering and the completed-session path.
5. Harden local storage, clipboard behaviour, DOM rendering, and CSV/TSV encoding.
6. Add responsive CSS and accessibility semantics.
7. Correct docs, add `.gitignore`, initialise/restore Git, and add a minimal CI/static-check workflow.

## Suggested regression scenarios

Run these manually and, where practical, automate them:

1. Count up: start, pause, resume, record two laps, reset; history has one correctly timed session.
2. Countdown: expire with laps; time-up occurs once, cannot Resume, and history has exactly one item.
3. Countdown: pause and Resume before expiry; remaining time and laps stay correct.
4. Mode switch while paused; saved session retains its original mode.
5. Finish with unrecorded time after last lap; total duration retains that time.
6. Try to record/skip while paused or finished; no lap is added.
7. Mark a skipped lap; it remains excluded if that is the product rule.
8. Edit a tag containing quotes, a comma, a tab, a newline, and `<tag>`; table and exports remain safe and valid.
9. Set `dse_timer_history` to invalid JSON in dev tools; timer/reset/history remain usable and show a storage warning.
10. Deny/unavailable clipboard access; Copy TSV provides an understandable fallback.
11. Check 320px, 375px, and desktop widths in light and dark mode.
12. Navigate by keyboard and screen reader: modal focus, Escape close, button activation, input labels, and toast announcements.

## Existing strengths to preserve

- Embedded JavaScript currently parses successfully.
- The foreground count-up/countdown delta arithmetic based on `performance.now()` is a sound basis for avoiding interval drift.
- The app has no runtime network/CDN dependency.
- The icon is a valid 1024×1024 JPEG and resolves from the local app folder.

## Constraints for implementation

- Preserve the dependency-free static architecture unless the product owner explicitly changes it.
- Keep the app usable when opened directly from disk.
- Avoid destructive operations; this workspace was not a Git checkout at audit time.
- Make changes incrementally and verify each P1 fix before moving to the next.
