# Know Your Time / 掌握時間

**Know Your Time** is a free, simple timer for HKDSE past-paper practice. It records the time spent on each question, helps you spot your pace, and lets you export your results for a spreadsheet.

No account, payment, installation, or internet connection is needed when you open the downloaded app on your own device.

## Start in two simple ways

### Use the website

Open [Know Your Time](https://27dser.github.io/Know-your-time/) in a modern browser.

### Use it offline from a downloaded folder

1. Download this project as a ZIP file from GitHub.
2. Unzip the file.
3. Double-click index.html.

The downloaded copy works without internet. The website itself needs internet when you first open it; installable web-app/offline caching for the website is planned for a later release.

## How to practise

1. Choose **Count Up** for an open-ended practice, or **Count Down** and enter the paper time limit.
2. Choose a question-label format, then press **Start**.
3. Press **Next question** when you finish a question. Press **Skip question** for a question you decide not to attempt.
4. Press **Finish practice** when you are done. If time passed after the last recorded question, choose whether to save it as a final question or keep it only in the total time.
5. Open **Analysis**, download **CSV**, or copy **TSV** to review your pace.

The app saves a finished practice once only. A finished countdown cannot be resumed or create duplicate history entries.

## Important behaviour

- **Refresh or accidentally close the page:** an unfinished session is restored on the same device.
- **Pause:** you cannot accidentally record a question while the timer is paused.
- **Skipped questions:** they stay out of the average pace calculation.
- **Background tabs:** the timer corrects itself when you return to the page. A browser or locked phone may delay the sound alert; the on-screen time-up message remains the reliable signal.
- **Privacy:** practice history stays in this browser on this device. Clearing browser website data also clears the saved history.

## Accessibility and languages

Use the language menu to switch between **English** and **繁體中文**. The app remembers your choice and follows your device’s Chinese language setting the first time it opens.

It also supports keyboard use:

| Key | Action |
| --- | --- |
| Space | Start / Pause |
| Enter or L | Next question |
| S | Skip question |
| R | Reset |
| Escape | Close an analysis, history, or copy dialog |

Keyboard shortcuts do not run while you are typing in a field or operating a button. The layout adapts to phones, tablets, and desktops.

## Downloading results

- **CSV** downloads a spreadsheet-ready report.
- **Copy TSV** copies tab-separated results for pasting into Excel, Google Sheets, or Numbers.
- Question labels with commas, quotes, tabs, new lines, or spreadsheet formulas are kept safe in the table and exports.

## For maintainers

This is a dependency-free static web app. The student-facing app remains in [index.html](index.html); no package install or build step is required.

Run the repeatable timer checks with:

    node --test tests/timer-core.test.cjs

Use [TESTING.md](TESTING.md) for the short real-device checklist before publishing.
