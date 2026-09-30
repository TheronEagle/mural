// Ported from LearningEngine.swift
// Vocabulary tracking and spaced repetition

import { EvidenceKind, Outcome, createAssessment, createWordProposal } from './models.js';
import { LanguageRegistry } from '../languages/index.js';

function validate(proposal, session) {
  const langModule = LanguageRegistry.module(session.languageID);
  if (!langModule) return null;
  const passage = session.passages.find(p => p.id === proposal.passageID && p.speaker === 'user');
  if (!passage || passage.revisionKey !== proposal.revisionKey) return null;
  if (proposal.suggestedLevel < 0 || proposal.suggestedLevel > 5 || proposal.words.length > 12) return null;

  const allowed = new Set(passage.fragments.map(f => f.id));
  const validated = { ...proposal };
  validated.nextGoal = String(proposal.nextGoal || '').slice(0, 300);
  validated.capability = String(proposal.capability || '').slice(0, 160);
  validated.words = proposal.words.filter(word => {
    if (word.language !== session.languageID) return false;
    if (!word.sourceIDs || word.sourceIDs.length === 0) return false;
    if (!word.sourceIDs.every(id => allowed.has(id))) return false;
    if (!isFinite(word.confidence) || word.confidence < 0.8 || word.confidence > 1) return false;
    if (!word.lemma || word.lemma.length === 0 || word.lemma.length >= 100) return false;
    if (!word.meaning || word.meaning.length === 0 || word.meaning.length >= 180) return false;
    if (!word.form || word.form.length === 0) return false;
    if (!word.quote || word.quote.length === 0) return false;

    const passageText = passage.fragments.filter(f => word.sourceIDs.includes(f.id)).map(f => f.text).join(' ');
    if (!passageText.toLowerCase().includes(word.quote.toLowerCase())) return false;
    if (!word.quote.toLowerCase().includes(word.form.toLowerCase())) return false;

    const result = { ...word };
    if (result.kind === 'independent') {
      const recentlyModeled = session.passages.some(p =>
        p.speaker === 'assistant' && p.fragments[0].startMS <= passage.fragments[0].startMS &&
        passage.fragments[0].startMS - p.fragments[p.fragments.length - 1].endMS < 90000 &&
        p.fragments.map(f => f.text).join(' ').toLowerCase().includes(word.form.toLowerCase())
      );
      if (passage.fragments.some(f => f.meaningVisible || f.typed) || recentlyModeled) {
        result.kind = 'assisted';
      }
    }
    return result;
  });
  return validated;
}

export function project(sessions, languageID = 'zh', hiddenWords = [], now = new Date()) {
  let level = 0, count = 0, successes = 0;
  let nextGoal = "Start with a greeting and one small question. Adjust from what the learner actually says.";
  const capabilityEvidence = {};
  const events = {};

  const filtered = sessions
    .filter(s => s.languageID === languageID)
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

  for (const session of filtered) {
    const seen = new Set();
    const sortedAssessments = [...session.assessments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const raw of sortedAssessments) {
      if (seen.has(raw.passageID)) continue;
      const a = validate(raw, session);
      if (!a) continue;
      seen.add(raw.passageID);
      count++;

      if (a.outcome === 'breakdown') {
        level = Math.max(0, level - 1);
        successes = 0;
      } else if (a.outcome === 'success') {
        successes++;
        if (successes >= 2) {
          level = Math.min(5, Math.max(level, Math.min(level + 1, a.suggestedLevel)));
          successes = 0;
        }
      } else {
        successes = 0;
      }

      if (a.nextGoal) nextGoal = a.nextGoal;
      if (a.outcome === 'success' && a.capability) {
        const dayKey = `${startOfDay(a.createdAt)}|${a.context}`;
        if (!capabilityEvidence[a.capability]) capabilityEvidence[a.capability] = new Set();
        capabilityEvidence[a.capability].add(dayKey);
      }

      const seenWords = new Set();
      for (const word of a.words) {
        if (hiddenWords.includes(word.key)) continue;
        if (seenWords.has(word.key)) continue;
        seenWords.add(word.key);
        if (!events[word.key]) events[word.key] = [];
        events[word.key].push({ word, date: a.createdAt, context: a.context });
      }
    }
  }

  const words = Object.entries(events).map(([key, observations]) => {
    const last = observations[observations.length - 1];
    const independent = observations.filter(o => o.word.kind === 'independent');
    const days = new Set(independent.map(o => startOfDay(o.date).getTime())).size;
    const contexts = new Set(independent.map(o => o.context)).size;
    const lastRecall = independent.length > 0 ? independent[independent.length - 1].date : null;

    let bars = independent.length === 0 ? 0 : 1;
    if (days >= 2) bars = 2;
    if (days >= 3 && contexts >= 2 && (independent[independent.length - 1].date.getTime() - independent[0].date.getTime() >= 7 * 86400000)) {
      bars = 3;
    }

    const intervals = [1, 1, 4, 14];
    const interval = intervals[bars] * 86400000;
    const due = new Date((lastRecall || last.date).getTime() + interval);
    if (now > due && bars > 1) bars -= 1;
    const lapse = observations.findLast(o => o.word.kind === 'lapse');
    if (lapse && lapse.date > (lastRecall || new Date(0))) bars = Math.min(bars, 1);

    return {
      id: key,
      lemma: last.word.lemma,
      meaning: last.word.meaning,
      form: last.word.form,
      example: last.word.quote,
      bars,
      understandingCount: observations.filter(o => o.word.kind === 'understanding').length,
      independentCount: independent.length,
      lastSeen: last.date,
      dueAt: due,
      get label() { return ['New', 'Fragile', 'Growing', 'Steady'][Math.min(3, Math.max(0, this.bars))]; },
      get explanation() {
        if (this.independentCount === 0) return "Heard or used with support. Try using it in your own words.";
        if (this.bars === 1) return "Used independently. We'll bring it back soon.";
        if (this.bars === 2) return "Recalled on different days. Still worth revisiting.";
        return "Recalled across days and contexts. Strength can fade with time.";
      }
    };
  }).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

  return {
    challenge: level,
    observationCount: count,
    nextGoal,
    capabilities: Object.entries(capabilityEvidence).filter(([_, v]) => v.size >= 3).map(([k]) => k).sort(),
    words,
    get levelLabel() { return count < 4 ? 'Getting to know you' : 'Finding your pace'; }
  };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
