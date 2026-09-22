// Ported from MeaningController.swift
// Debounced translation controller for conversation subtitles

export class MeaningController {
  constructor({ delay = 450, translate } = {}) {
    this._text = '';
    this._isLoading = false;
    this._error = null;
    this._onResult = null;
    this._translate = translate;
    this._delay = delay;
    this._desired = null;
    this._rendered = null;
    this._worker = null;
    this._generation = 0;
  }

  get text() { return this._text; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }

  update(request, cached) {
    const changedContext = this._desired && !this._sharesContext(this._desired, request);
    if (changedContext) this.reset();
    this._desired = request;
    if (cached && cached.length > 0) {
      this._cancelWorker();
      this._text = cached;
      this._rendered = request;
      this._error = null;
      return;
    }
    if (this._rendered && this._rendered.id === request.id && this._rendered.passageID === request.passageID) return;
    if (this._rendered && !request.text.startsWith(this._rendered.text)) {
      this._text = '';
      this._rendered = null;
    }
    if (!this._worker && !this._error) this._begin();
  }

  reset() {
    this._cancelWorker();
    this._desired = null;
    this._rendered = null;
    this._text = '';
    this._error = null;
  }

  retry() {
    if (!this._desired) return;
    this._cancelWorker();
    this._error = null;
    this._begin();
  }

  _cancelWorker() {
    this._generation++;
    if (this._worker) {
      clearTimeout(this._worker);
      this._worker = null;
    }
    this._isLoading = false;
  }

  _begin() {
    if (!this._desired || this._worker) return;
    this._isLoading = true;
    const token = this._generation;
    const request = this._desired;

    this._worker = setTimeout(async () => {
      if (token !== this._generation || !this._desired) return;
      try {
        const result = await this._translate(request);
        if (token !== this._generation || !this._desired) return;
        if (!result.text.trim()) throw new Error('The translation came back empty. Please try again.');

        if (this._onResult) this._onResult(request, result);
        if (this._sharesContext(request, this._desired) && this._desired.text.startsWith(request.text)) {
          this._text = result.text;
          this._rendered = request;
        }
        this._worker = null;
        this._isLoading = false;
        if (this._designed !== request && this._desired !== request) this._begin();
      } catch (err) {
        if (token !== this._generation) return;
        this._worker = null;
        this._isLoading = false;
        this._error = err.message;
      }
    }, this._delay);
  }

  _sharesContext(a, b) {
    return a.sessionID === b.sessionID && a.passageID === b.passageID &&
      a.learningLanguageID === b.learningLanguageID && a.meaningLanguage === b.meaningLanguage;
  }
}
