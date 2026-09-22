// Ported from Models.swift
// Data structures for Mural's learning system

export const Speaker = Object.freeze({ user: 'user', assistant: 'assistant' });
export const EvidenceKind = Object.freeze({
  exposure: 'exposure',
  understanding: 'understanding',
  assisted: 'assisted',
  independent: 'independent',
  lapse: 'lapse'
});
export const Outcome = Object.freeze({
  success: 'success',
  partial: 'partial',
  breakdown: 'breakdown',
  uncertain: 'uncertain'
});

let _fragmentIdCounter = 0;
export function nextFragmentId() {
  return `f${++_fragmentIdCounter}`;
}

export function createFragment({ id, speaker, text, startMS, endMS, receivedAt, meaningVisible, typed } = {}) {
  return {
    id: id || nextFragmentId(),
    revision: 0,
    previousTexts: [],
    speaker,
    text,
    startMS: startMS || 0,
    endMS: endMS || 0,
    receivedAt: receivedAt || new Date(),
    meaningVisible: meaningVisible || false,
    typed: typed || false
  };
}

// Join fragment texts matching the Swift logic
function joinParts(parts) {
  const han = c => {
    if (!c) return false;
    const code = c.codePointAt(0);
    return (code >= 0x3400 && code <= 0x4DBF) || (code >= 0x4E00 && code <= 0x9FFF) ||
           (code >= 0xF900 && code <= 0xFAFF) || (code >= 0x20000 && code <= 0x323AF);
  };
  return parts.reduce((result, part) => {
    if (!result) return part;
    const last = result[result.length - 1];
    const first = part[0];
    if (!first) return result + part;
    const needsSpace = !last.match(/\s/) && !first.match(/\s/) && !first.match(/[.,!?;:'")\]}»、】』\)。，！？；：」』】]/) &&
      !(first.match(/[（\[{¿¡""'『「「]/) || (han(first) && (han(last) || (last.codePointAt(0) >= 0x3000 && last.codePointAt(0) <= 0x303F) || (last.codePointAt(0) >= 0xFF00 && last.codePointAt(0) <= 0xFFEF))));
    if (needsSpace) result += ' ';
    return result + part;
  }, '');
}

export function buildPassages(fragments) {
  const sorted = [...fragments].sort((a, b) => a.startMS - b.startMS || a.id.localeCompare(b.id));
  const result = [];
  for (const fragment of sorted) {
    const lastIdx = result.length - 1;
    if (lastIdx >= 0 && result[lastIdx].speaker === fragment.speaker &&
        fragment.startMS - result[lastIdx].endMS <= 2200 &&
        !fragment.typed && !(result[lastIdx].fragments[result[lastIdx].fragments.length - 1]?.typed)) {
      result[lastIdx].fragments.push(fragment);
    } else {
      result.push({ id: fragment.id, speaker: fragment.speaker, fragments: [fragment] });
    }
  }
  return result.sort((a, b) => a.fragments[0].startMS - b.fragments[0].startMS);
}

export function passageText(passage) {
  return joinParts(passage.fragments.map(f => f.text));
}

export function passageRevisionKey(passage) {
  return passage.fragments.map(f => `${f.id}:${f.revision}`).join(',');
}

export function createWordProposal({ lemma, meaning, form, kind, confidence, sourceIDs, quote, language }) {
  return {
    lemma, meaning, form, kind, confidence, sourceIDs, quote,
    language: language || 'zh',
    get key() { return `${this.language}|${this.lemma.trim().toLowerCase()}|${this.meaning.toLowerCase()}`; }
  };
}

export function createAssessment({ passageID, revisionKey, outcome, suggestedLevel, nextGoal, capability, words, createdAt, context }) {
  return {
    passageID, revisionKey, outcome, suggestedLevel,
    nextGoal: nextGoal || '',
    capability: capability || '',
    words: words || [],
    createdAt: createdAt || new Date(),
    context: context || 'free',
    get id() { return this.passageID; }
  };
}

export function createSourceLink(title, url) {
  return { title, url, get id() { return url; } };
}

export function createTopicBrief(languageID, query, text, sources) {
  return {
    languageID, query, text, sources, id: crypto.randomUUID(),
    retrievedAt: new Date(),
    get isFresh() { return Date.now() - this.retrievedAt.getTime() < 6 * 3600 * 1000; }
  };
}

export function createSessionRecord({ languageID, themeID, title } = {}) {
  return {
    id: crypto.randomUUID(),
    languageID: languageID || 'zh',
    providerID: null,
    startedAt: new Date(),
    endedAt: null,
    themeID: themeID || null,
    title: title || 'A little Chinese',
    fragments: [],
    assessments: [],
    translations: {},
    topics: [],
    voiceSeconds: 0,
    usageFinal: false,
    inputTokens: 0,
    outputTokens: 0,
    searchCalls: 0,
    endReason: null,

    get passages() { return buildPassages(this.fragments); },

    append(fragment) {
      if (this.fragments.some(f => f.id === fragment.id)) return;
      this.fragments.push(fragment);
      this.invalidateChangedAssessments();
    },

    invalidateChangedAssessments() {
      const current = {};
      for (const p of this.passages) {
        current[p.id] = passageRevisionKey(p);
      }
      this.assessments = this.assessments.filter(a => current[a.passageID] === a.revisionKey);
    },

    correctFragment(id, text) {
      const idx = this.fragments.findIndex(f => f.id === id);
      if (idx === -1) return;
      this.fragments[idx].previousTexts.push(this.fragments[idx].text);
      this.fragments[idx].text = text;
      this.fragments[idx].revision += 1;
      this.translations = Object.fromEntries(
        Object.entries(this.translations).filter(([k]) => !k.includes(id))
      );
      this.invalidateChangedAssessments();
    }
  };
}

export function createPreferences() {
  return {
    learningLanguageID: 'zh',
    meaningVisible: true,
    meaningLanguage: 'English',
    sessionMinutes: 15,
    hiddenWords: [],
    interests: '',
    hasOnboarded: false,
    aiConsentVersion: null
  };
}
