const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadTimerCore() {
  const appPath = path.join(__dirname, '..', 'index.html');
  const source = fs.readFileSync(appPath, 'utf8');
  const match = source.match(/<script id="timerCore">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html must expose the timer core in <script id="timerCore">');

  const context = { globalThis: {} };
  vm.runInNewContext(match[1], context, { filename: 'index.html timer core' });
  assert.ok(context.globalThis.TimerCore, 'timer core must be available to the app and test suite');
  return context.globalThis.TimerCore;
}

const TimerCore = loadTimerCore();

test('an expired countdown is terminal and cannot restart', () => {
  let session = TimerCore.createSession({ id: 'countdown', mode: 'countdown', countdownDurationMs: 1000 });
  session = TimerCore.startSession(session, 100);
  session = TimerCore.finishSession(session, 1200);

  assert.equal(session.state, TimerCore.STATES.FINISHED);
  assert.equal(TimerCore.currentElapsedMs(session, 1200), 1000);
  assert.equal(TimerCore.startSession(session, 1300).state, TimerCore.STATES.FINISHED);
  assert.equal(TimerCore.canRecordQuestion(session), false);
});

test('manual and time-up finishes keep their distinct user-facing reason', () => {
  const manual = TimerCore.finishSession(TimerCore.startSession(TimerCore.createSession({ mode: 'countup' }), 0), 100);
  const timeUp = TimerCore.finishSession(TimerCore.startSession(TimerCore.createSession({ mode: 'countdown', countdownDurationMs: 100 }), 0), 100, 'timeup');

  assert.equal(manual.finishReason, 'manual');
  assert.equal(timeUp.finishReason, 'timeup');
});

test('a completed session can only be marked saved once', () => {
  const finished = TimerCore.finishSession(
    TimerCore.startSession(TimerCore.createSession({ id: 'once', mode: 'countup' }), 0),
    5000
  );
  const first = TimerCore.markSessionSaved(finished, 5000);
  const second = TimerCore.markSessionSaved(first.session, 6000);

  assert.equal(first.didSave, true);
  assert.equal(second.didSave, false);
  assert.equal(second.session.savedAtMs, 5000);
});

test('session analytics retain time after the final recorded question', () => {
  let session = TimerCore.createSession({ id: 'elapsed', mode: 'countup' });
  session = TimerCore.startSession(session, 1000);
  session = TimerCore.recordQuestion(session, { tag: 'Q1', isSkipped: false }, 2000).session;
  session = TimerCore.finishSession(session, 6000);
  const analytics = TimerCore.getAnalytics(session, 6000);

  assert.equal(analytics.totalTimeMs, 5000);
  assert.equal(analytics.unassignedTimeMs, 4000);
  assert.equal(analytics.meanTimeMs, 1000);
});

test('questions cannot be recorded while paused or finished', () => {
  let session = TimerCore.createSession({ id: 'no-laps', mode: 'countup' });
  session = TimerCore.startSession(session, 0);
  session = TimerCore.pauseSession(session, 1000);
  assert.equal(TimerCore.recordQuestion(session, { tag: 'Q1' }, 1000).changed, false);

  session = TimerCore.finishSession(session, 1000);
  assert.equal(TimerCore.recordQuestion(session, { tag: 'Q1' }, 1000).changed, false);
});

test('skipped questions stay excluded from the average', () => {
  let session = TimerCore.createSession({ id: 'skip', mode: 'countup' });
  session = TimerCore.startSession(session, 0);
  const recorded = TimerCore.recordQuestion(session, { tag: 'Q1', isSkipped: true }, 1000);
  const lapId = recorded.session.laps[0].id;
  const changed = TimerCore.setMeanIncluded(recorded.session, lapId, true);

  assert.equal(changed.session.laps[0].excludeFromMean, true);
  assert.equal(changed.changed, false);
});

test('question patterns and exports preserve data without spreadsheet formulas', () => {
  assert.equal(TimerCore.makeQuestionTag('MC', 1), 'MC 1');
  assert.equal(TimerCore.makeQuestionTag('Part A Q', 2), 'Part A Q2');
  assert.equal(TimerCore.csvField('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(TimerCore.csvField('\t=SUM(A1:A2)'), "'\t=SUM(A1:A2)");
  assert.equal(TimerCore.csvField('Q1, "Essay"'), '"Q1, ""Essay"""');
  assert.equal(TimerCore.tsvField('A\tB\nC'), 'A B C');
  assert.equal(TimerCore.tsvField('\t=SUM(A1:A2)'), "' =SUM(A1:A2)");
});

test('a running session restores the correct elapsed duration after reopening', () => {
  let session = TimerCore.createSession({ id: 'resume', mode: 'countup' });
  session = TimerCore.startSession(session, 1_000);
  const restored = TimerCore.restoreSession(session, 4_250);

  assert.equal(TimerCore.currentElapsedMs(restored, 4_250), 3_250);
  assert.equal(restored.state, TimerCore.STATES.RUNNING);
});

test('recording at a countdown deadline resolves as time-up', () => {
  let session = TimerCore.createSession({ id: 'deadline', mode: 'countdown', countdownDurationMs: 1000 });
  session = TimerCore.startSession(session, 0);
  const result = TimerCore.recordQuestion(session, { tag: 'Q1' }, 1000);

  assert.equal(result.changed, false);
  assert.equal(result.session.state, TimerCore.STATES.FINISHED);
  assert.equal(result.session.finishReason, 'timeup');
});

test('saved-history analytics use the stored total duration', () => {
  const analytics = TimerCore.getHistoryAnalytics({
    totalDurationMs: 5000,
    analytics: { totalQs: 0, completedCount: 0, skippedCount: 0, meanTimeMs: 0, fastest: null, slowest: null },
    laps: []
  });

  assert.equal(analytics.totalTimeMs, 5000);
});

test('the in-page clock remains monotonic if the system clock moves backward', () => {
  const clock = TimerCore.createMonotonicClock(10_000, 500);

  assert.equal(clock(650), 10_150);
  assert.equal(clock(450), 10_150);
});
