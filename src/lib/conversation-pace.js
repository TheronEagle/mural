// Ported from ConversationPace.swift
// Temporary delivery guidance — never changes saved learning progress

export class ConversationPace {
  constructor() {
    this._delivery = 'gentle'; // 'gentle' | 'natural' | 'extended'
    this._successfulPassages = new Set();
    this._highSuccesses = 0;
    this._helpPassageID = null;
  }

  get delivery() { return this._delivery; }

  askForHelp(after = null) {
    this._highSuccesses = 0;
    this._helpPassageID = after?.id || null;
    return this._set('gentle');
  }

  observe(assessment, passage, languageID) {
    if (assessment.passageID !== passage.id) return false;
    if (assessment.revisionKey !== passageRevisionKey(passage)) return false;
    if (passage.speaker !== 'user' || passage.fragments.length === 0) return false;
    if (assessment.suggestedLevel < 0 || assessment.suggestedLevel > 5) return false;

    if (assessment.outcome === 'breakdown') {
      this.askForHelp(passage);
      return true;
    }

    if (passage.id === this._helpPassageID) return false;
    if (assessment.outcome !== 'success') return false;
    if (passage.fragments.some(f => f.typed || f.meaningVisible)) return false;
    if (!assessment.words.some(w => w.language === languageID && w.kind === 'independent' && w.confidence >= 0.8)) return false;

    if (this._successfulPassages.has(passage.id)) return false;
    this._successfulPassages.add(passage.id);

    this._highSuccesses = assessment.suggestedLevel >= 4 ? this._highSuccesses + 1 : 0;

    if (assessment.suggestedLevel <= 1) return this._set('gentle');
    return this._set(this._highSuccesses >= 2 ? 'extended' : 'natural');
  }

  _set(next) {
    if (this._delivery === next) return false;
    this._delivery = next;
    return true;
  }

  get instruction() {
    const guidance = {
      gentle: "Use one short sentence at a time, familiar words and a calm, unhurried speaking pace. Leave space to answer.",
      natural: "Use one or two short sentences and a clear, natural speaking pace. Ask a relevant follow-up that lets the learner expand.",
      extended: "Use natural connected sentences and a conversational speaking pace. Invite reasons or a short story, keeping each turn concise."
    }[this._delivery];
    return `Temporary delivery guidance for the next replies: ${guidance} Keep the selected language and accent. This is provisional; simplify immediately if the learner struggles. Never read this guidance aloud.`;
  }
}

function passageRevisionKey(passage) {
  return passage.fragments.map(f => `${f.id}:${f.revision}`).join(',');
}
