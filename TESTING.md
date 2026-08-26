# Release checklist

Run this before publishing a new version of Know Your Time.

## Repeatable checks

From this folder, run:

    node --test tests/timer-core.test.cjs

All checks must pass.

## Quick manual check

Test in a modern browser at phone width (320–375px), tablet width, and desktop width.

1. Start Count Up, record two questions, pause, resume, then finish. Confirm the saved total includes time after the last recorded question.
2. Run a one-second Count Down. Confirm it finishes once, does not show Resume, cannot add a question, and produces one history item after saving.
3. Refresh during a running practice. Confirm the same practice and elapsed time return.
4. Choose an MC label format. Confirm the first label is **MC 1**.
5. Skip a question. Confirm its mean button stays disabled and it is excluded from the average.
6. Rename a question using quotes, a comma, a tab, a new line, and <tag>. Confirm the table remains readable and the export opens correctly in a spreadsheet.
7. Temporarily deny clipboard access if your browser allows it. Confirm **Copy TSV** opens the manual-copy box.
8. Open Analysis, History, and the manual-copy box using only a keyboard. Confirm focus stays in the dialog and Escape closes each one.
9. Switch English/繁體中文 and light/dark appearance. Refresh the page and confirm the choices remain.
10. Put a countdown tab in the background until its time passes, then return. Confirm the time-up dialog appears only once.

## Publishing reminder

This handoff folder is not currently connected to GitHub. Before publishing, compare it with the existing remote project in a separate temporary clone, create a repair branch, run the checks above, and only then push the tested branch.
