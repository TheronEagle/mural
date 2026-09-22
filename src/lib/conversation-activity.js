// Ported from ConversationActivity.swift
// An unanswered check-in never extends the paid session. Times use a monotonic clock.

export class ConversationActivity {
  static quietSeconds = 35;
  static checkInSeconds = 15;
  static speechGraceSeconds = 15;
  static typingGraceSeconds = 60;
  static responseGraceSeconds = 45;

  constructor(now) {
    this._quietSince = now;
    this._outputDeadline = now + 60000;
    this._lastInput = null;
    this._typingStarted = null;
    this._lastTyping = null;
    this._busyStarted = null;
    this._checkedIn = false;
  }

  learnerEngaged(now) {
    this._quietSince = now;
    this._outputDeadline = now + 60000;
    this._checkedIn = false;
    this._typingStarted = null;
    this._lastTyping = null;
    this._lastInput = null;
    this._busyStarted = null;
  }

  assistantActive(now) {
    if (!this._checkedIn && now <= this._outputDeadline) {
      this._quietSince = now;
    }
  }

  inputActive(now) {
    this._lastInput = now;
  }

  typing(now) {
    if (this._typingStarted === null) this._typingStarted = now;
    this._lastTyping = now;
  }

  // Returns 'wait' | 'checkIn' | 'warning(seconds)' | 'end'
  tick(now, { muted = false, busy = false } = {}) {
    if (busy && this._busyStarted === null) this._busyStarted = now;
    if (!busy) this._busyStarted = null;

    const recentInput = !muted && this._lastInput !== null && (now - this._lastInput < 1.5);
    const editing = this._lastTyping !== null && (now - this._lastTyping < 10);

    let deadline = this._quietSince + ConversationActivity.quietSeconds;
    if (recentInput) deadline += ConversationActivity.speechGraceSeconds;
    if (editing && this._typingStarted !== null) {
      deadline = Math.max(deadline, this._typingStarted + ConversationActivity.typingGraceSeconds);
    }
    if (busy && this._busyStarted !== null) {
      deadline = Math.max(deadline, this._busyStarted + ConversationActivity.responseGraceSeconds);
    }

    if (now >= deadline) return 'end';
    if (deadline - now <= 5) return `warning(${Math.ceil(deadline - now)})`;
    if (!this._checkedIn && !muted && !recentInput && !editing && !busy && (now - this._quietSince >= ConversationActivity.checkInSeconds)) {
      this._checkedIn = true;
      return 'checkIn';
    }
    return 'wait';
  }
}
