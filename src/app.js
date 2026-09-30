// src/app.js
// Main application logic for Mural Web

import { conversationThemes } from './lib/themes.js';
import { LanguageRegistry, MeaningLanguages } from './languages/index.js';
import { TeachingPolicy } from './lib/teaching-policy.js';
import { LearningEngine } from './lib/learning-engine.js';
import { ConversationPace } from './lib/conversation-pace.js';
import { ConversationActivity } from './lib/conversation-activity.js';
import { MeaningController } from './lib/meaning-controller.js';
import { createFragment, buildPassages, passageText, passageRevisionKey, createAssessment, createWordProposal, createSessionRecord, createPreferences } from './lib/models.js';

// DOM Elements
const elements = {
  talkBtn: document.getElementById('talkBtn'),
  wordsBtn: document.getElementById('wordsBtn'),
  themesBtn: document.getElementById('themesBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  
  talkView: document.getElementById('talkView'),
  wordsView: document.getElementById('wordsView'),
  themesView: document.getElementById('themesView'),
  settingsView: document.getElementById('settingsView'),
  
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  micBtn: document.getElementById('micBtn'),
  
  meaningText: document.getElementById('meaningText'),
  meaningLoading: document.getElementById('meaningLoading'),
  meaningError: document.getElementById('meaningError'),
  
  wordsList: document.getElementById('wordsList'),
  showNewOnly: document.getElementById('showNewOnly'),
  
  themesGrid: document.getElementById('themesGrid'),
  
  languageSelect: document.getElementById('languageSelect'),
  meaningLanguageSelect: document.getElementById('meaningLanguageSelect'),
  sessionLength: document.getElementById('sessionLength'),
  
  exportDataBtn: document.getElementById('exportDataBtn'),
  importDataBtn: document.getElementById('importDataBtn'),
  clearDataBtn: document.getElementById('clearDataBtn'),
  
  aiProviderSelect: document.getElementById('aiProviderSelect'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  modelInput: document.getElementById('modelInput'),
  
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  
  modalOverlay: document.getElementById('modalOverlay'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalContent: document.getElementById('modalContent'),
  modalClose: document.getElementById('modalClose')
};

// App State
let state = {
  session: null,
  preferences: createPreferences(),
  learner: null,
  conversationPace: new ConversationPace(),
  conversationActivity: null,
  meaningController: null,
  isListening: false,
  apiConfig: {
    provider: 'openrouter',
    apiKey: null,
    model: 'meta-llama/llama-3.3-70b-instruct:free'
  }
};

// Initialize the app
async function init() {
  // Load preferences from localStorage
  const savedPrefs = localStorage.getItem('muralPrefs');
  if (savedPrefs) {
    try {
      state.preferences = JSON.parse(savedPrefs);
    } catch (e) {
      console.error('Failed to parse preferences:', e);
    }
  }
  
  // Load session if exists
  const savedSession = localStorage.getItem('muralSession');
  if (savedSession) {
    try {
      const sessionData = JSON.parse(savedSession);
      // Reconstruct session object (simplified)
      state.session = createSessionRecord({
        languageID: sessionData.languageID,
        themeID: sessionData.themeID,
        title: sessionData.title
      });
      state.session.fragments = sessionData.fragments || [];
      state.session.assessments = sessionData.assessments || [];
      state.session.translations = sessionData.translations || {};
      state.session.topics = sessionData.topics || [];
      state.session.startedAt = new Date(sessionData.startedAt);
      if (sessionData.endedAt) state.session.endedAt = new Date(sessionData.endedAt);
    } catch (e) {
      console.error('Failed to parse session:', e);
    }
  }

  // Load stored API key if exists
  const savedApiKey = localStorage.getItem('muralApiKey');
  if (savedApiKey) {
    state.apiConfig.apiKey = savedApiKey;
  }

  // Initialize meaning controller
  state.meaningController = new MeaningController({
    delay: 450,
    translate: translateText
  });
  state.meaningController._onResult = handleMeaningResult;
  
  // Setup event listeners
  setupEventListeners();
  
  // Render initial state
  renderViews();
  renderThemes();
  updateSettingsFromPrefs();
  
  // If no session, start a new one
  if (!state.session) {
    startNewSession();
  }
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  elements.talkBtn.addEventListener('click', () => switchView('talk'));
  elements.wordsBtn.addEventListener('click', () => switchView('words'));
  elements.themesBtn.addEventListener('click', () => switchView('themes'));
  elements.settingsBtn.addEventListener('click', () => switchView('settings'));
  
  // Chat
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.micBtn.addEventListener('click', toggleMic);
  elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Settings
  elements.exportDataBtn.addEventListener('click', exportData);
  elements.importDataBtn.addEventListener('click', importData);
  elements.clearDataBtn.addEventListener('click', clearData);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Modal
  elements.modalClose.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });
  
  // Meaning section click
  elements.meaningText.addEventListener('click', () => {
    // Toggle meaning visibility - in real app this would be more sophisticated
    elements.meaningText.style.fontWeight = elements.meaningText.style.fontWeight === 'bold' ? 'normal' : 'bold';
  });
}

// View switching
function switchView(viewName) {
  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.id === `${viewName}Btn`) btn.classList.add('active');
  });
  
  // Show/hide views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    if (view.id === `${viewName}View`) view.classList.add('active');
  });
  
  // Focus chat input when switching to talk view
  if (viewName === 'talk') {
    setTimeout(() => elements.chatInput.focus(), 100);
  }
}

// Session management
function startNewSession() {
  const language = state.preferences.learningLanguageID || 'zh';
  const themeId = localStorage.getItem('muralTheme') || 'introductions';
  
  state.session = createSessionRecord({
    languageID: language,
    themeID: themeId,
    title: `${LanguageRegistry.module(language)?.name} conversation`
  });
  
  state.conversationActivity = new ConversationActivity(Date.now());
  state.conversationPace = new ConversationPace();
  
  // Send initial greeting
  const greeting = TeachingPolicy.greeting(LanguageRegistry.module(language));
  addAssistantMessage(greeting);
  
  saveSession();
}

// Messaging
async function sendMessage() {
  const text = elements.chatInput.value.trim();
  if (!text) return;
  
  // Add user message
  const fragment = createFragment({
    speaker: 'user',
    text: text,
    startMS: Date.now(),
    endMS: Date.now() + 1000, // approximate
    receivedAt: new Date()
  });
  state.session.append(fragment);
  
  addUserMessage(text);
  elements.chatInput.value = '';
  
  // Update activity tracker
  state.conversationActivity.learnerEngaged(Date.now());
  
  // Get AI response
  try {
    const aiResponse = await getAIResponse();
    
    // Add assistant message
    const assistantFragment = createFragment({
      speaker: 'assistant',
      text: aiResponse,
      startMS: Date.now(),
      endMS: Date.now() + 2000,
      receivedAt: new Date()
    });
    state.session.append(assistantFragment);
    
    addAssistantMessage(aiResponse);
    
    // Trigger assessment periodically
    if (state.session.fragments.length % 4 === 0) {
      await assessConversation();
    }
    
    // Update meaning if visible
    if (state.preferences.meaningVisible) {
      updateMeaning();
    }
    
    saveSession();
  } catch (error) {
    console.error('AI response error:', error);
    addAssistantMessage("Sorry, I had trouble understanding that. Could you try again?");
    saveSession();
  }
}

async function getAIResponse() {
  if (!state.session) throw new Error('No active session');
  
  const language = LanguageRegistry.module(state.session.languageID);
  if (!language) throw new Error('Language module not found');
  
  const learner = state.learner || LearningEngine.project([state.session], state.session.languageID, state.preferences.hiddenWords || []);
  
  // Get teaching policy prompt
  const themeObj = conversationThemes.find(t => t.id === state.session.themeID) || null;
  const policyPrompt = TeachingPolicy.voice(language, learner, themeObj, state.preferences.interests || '', state.preferences.meaningLanguage || 'English');
  
  // Build conversation context
  const context = TeachingPolicy.context(state.session);
  const fullPrompt = `${policyPrompt}\n\n${context}`;
  
  // Call API
  return await callAIAPI(fullPrompt);
}

async function callAIAPI(prompt) {
  // Try to use the actual API if configured
  if (state.apiConfig.apiKey && state.apiConfig.provider !== 'none') {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: prompt,
          input: '',
          search: false
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.text || "I didn't get a response. Try again?";
    } catch (error) {
      console.warn('API call failed, falling back to simulation:', error);
    }
  }

  // Fallback to simulated response
  return await simulateAIResponse(prompt);
}

async function simulateAIResponse(prompt) {
  // Simple simulation - in reality this would call the AI
  // For demo, we'll return a canned response based on language
  const language = LanguageRegistry.module(state.session.languageID);
  if (!language) return "I'm having trouble right now. Let's try again.";
  
  // Simple responses for demo
  const responses = {
    zh: ["你好！今天过得怎么样？", " interesante! 你喜欢学习中文吗？", "那是个好主意！我们可以一起练习。"],
    es: ["¡Hola! ¿Cómo estuvo tu día?", "¡Interesante! ¿Te gusta aprender español?", "¡Buena idea! Podemos practicar juntos."],
    en: ["Hi! How was your day?", "Interesting! Do you like learning English?", "Great idea! We can practice together."],
    fr: ["Bonjour ! Comment s'est passée ta journée ?", "Intéressant ! Tu aimes apprendre le français ?", "Bonne idée ! On peut pratiquer ensemble."],
    de: ["Hallo! Wie war dein Tag?", "Interessant! Magst du Deutsch lernen?", "Gute Idee! Wir können zusammen üben."],
    it: ["Ciao! Come è stata la tua giornata?", "Interessante! Ti piace imparare l'italiano?", "Buona idea! Possiamo praticare insieme."],
    pt: ["Olá! Como foi o seu día?", "Interessante! Você gosta de aprender português?", "Ótima ideia! Podemos praticar juntos."],
    nb: ["Hei! Hvordan har dagen din vært?", "Interessant! Likes du å lære norsk?", "Flott idé! Vi kan øve oss sammen."]
  };
  
  const langResponses = responses[language.id] || responses.en;
  const response = langResponses[Math.floor(Math.random() * langResponses.length)];
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  return response;
}

function addUserMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user';
  msgDiv.textContent = text;
  elements.chatMessages.appendChild(msgDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addAssistantMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message assistant';
  msgDiv.textContent = text;
  elements.chatMessages.appendChild(msgDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Meaning functionality
function updateMeaning() {
  if (!state.session || state.session.fragments.length === 0) return;
  
  const lastPassage = buildPassages(state.session.fragments).pop();
  if (!lastPassage) return;
  
  const request = {
    sessionID: state.session.id,
    passageID: lastPassage.id,
    revisionKey: passageRevisionKey(lastPassage),
    text: passageText(lastPassage),
    learningLanguageID: state.session.languageID,
    meaningLanguage: state.preferences.meaningLanguage || 'English'
  };
  
  state.meaningController.update(request, '');
}

function handleMeaningResult(request, result) {
  elements.meaningText.textContent = result.text;
  elements.meaningLoading.style.display = 'none';
  elements.meaningError.textContent = '';
}

async function translateText(request) {
    // This would call our translation API
    // For now, return a placeholder
    return await new Promise(resolve => setTimeout(() => resolve({
        text: "Translation would appear here...",
        inputTokens: 0,
        outputTokens: 0
    }), 500));
}

// Assessment
async function assessConversation() {
  if (!state.session || state.session.fragments.length < 2) return;
  
  try {
    const language = LanguageRegistry.module(state.session.languageID);
    if (!language) return;
    
    const assessmentPrompt = TeachingPolicy.assessment(language);
    const context = TeachingPolicy.context(state.session);
    const fullPrompt = `${assessmentPrompt}\n\n${context}`;
    
    // In reality, this would use a structured output schema
    // For now, we'll simulate
    const assessment = await simulateAssessment();
    
    if (assessment) {
      // Add assessment to session
      const assessmentObj = createAssessment({
        passageID: assessment.passageID,
        revisionKey: assessment.revisionKey,
        outcome: assessment.outcome,
        suggestedLevel: assessment.suggestedLevel,
        nextGoal: assessment.nextGoal,
        capability: assessment.capability,
        words: assessment.words.map(w => createWordProposal(w)),
        createdAt: new Date(),
        context: assessment.context
      });
      state.session.assessments.push(assessmentObj);
      
      // Update conversation pace
      const passage = state.session.passages.find(p => p.id === assessment.passageID);
      if (passage) {
        state.conversationPace.observe(assessmentObj, passage, state.session.languageID);
      }
      
      // Update learner state
      state.learner = LearningEngine.project([state.session], state.session.languageID, state.preferences.hiddenWords || []);
      
      saveSession();
      renderWordsList();
    }
  } catch (error) {
    console.error('Assessment error:', error);
  }
}

async function simulateAssessment() {
  // Simulate an assessment result
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Pick a recent user passage
  const userPassages = state.session.passages.filter(p => p.speaker === 'user');
  if (userPassages.length === 0) return null;
  
  const passage = userPassages[userPassages.length - 1];
  
  // Simulate different outcomes
  const outcomes = ['success', 'success', 'success', 'partial', 'breakdown'];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
  
  return {
    passageID: passage.id,
    revisionKey: passageRevisionKey(passage),
    outcome: outcome,
    suggestedLevel: Math.floor(Math.random() * 6),
    nextGoal: "Try using more complete sentences next time.",
    capability: outcome === 'success' ? "Can handle basic greetings and introductions." : "",
    words: [
      {
        lemma: "hello",
        meaning: "a greeting",
        form: "hello",
        kind: "independent",
        confidence: 0.9,
        sourceIDs: [passage.fragments[0].id],
        quote: "hello",
        language: state.session.languageID
      }
    ],
    context: "free conversation"
  };
}

// Words rendering
function renderWordsList() {
  if (!state.learner) {
    elements.wordsList.innerHTML = '<div class="words-empty">Start chatting to see your vocabulary grow here.</div>';
    return;
  }
  
  const words = state.learner.words;
  const showNewOnly = elements.showNewOnly.checked;
  
  const filteredWords = words.filter(word => {
    if (!showNewOnly) return true;
    return word.bars <= 1; // New or Fragile
  });
  
  if (filteredWords.length === 0) {
    elements.wordsList.innerHTML = '<div class="words-empty">No words match your filter.</div>';
    return;
  }
  
  elements.wordsList.innerHTML = '';
  
  for (const word of filteredWords) {
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    
    const badgeClass = word.bars === 0 ? 'new' : 
                      word.bars === 1 ? 'fragile' : 
                      word.bars === 2 ? 'growing' : 'steady';
    
    wordCard.innerHTML = `
      <div class="word-header">
        <div class="word-main">${word.lemma}</div>
        <div class="word-badge ${badgeClass}">${word.label}</div>
      </div>
      <div class="word-details">
        <strong>Meaning:</strong> ${word.meaning}<br>
        <strong>Form:</strong> ${word.form}<br>
        <strong>Seen:</strong> ${word.independentCount} times independently, ${word.understandingCount} times with understanding
      </div>
      <div class="word-example">"${word.example}"</div>
    `;
    
    elements.wordsList.appendChild(wordCard);
  }
}

// Themes rendering
function renderThemes() {
  elements.themesGrid.innerHTML = '';
  
  for (const theme of conversationThemes) {
    const themeCard = document.createElement('div');
    themeCard.className = 'theme-card';
    themeCard.innerHTML = `
      <div class="theme-icon">${theme.symbol}</div>
      <div class="theme-title">${theme.title}</div>
      <div class="theme-subtitle">${theme.subtitle}</div>
      <div class="theme-situation">${theme.situation}</div>
    `;
    themeCard.addEventListener('click', () => {
      state.session.themeID = theme.id;
      state.session.title = `A little ${LanguageRegistry.module(state.session.languageID)?.name}`;
      saveSession();
      
      // Reset conversation with new theme
      startNewSession();
      switchView('talk');
    });
    elements.themesGrid.appendChild(themeCard);
  }
}

// Settings
function updateSettingsFromPrefs() {
  elements.languageSelect.value = state.preferences.learningLanguageID || 'zh';
  elements.meaningLanguageSelect.value = state.preferences.meaningLanguage || 'English';
  elements.sessionLength.value = state.preferences.sessionMinutes || 15;
  
  elements.aiProviderSelect.value = state.apiConfig.provider || 'openrouter';
  elements.modelInput.value = state.apiConfig.model || 'meta-llama/llama-3.3-70b-instruct:free';
  // API key is not stored in prefs for security
}

function saveSettings() {
  state.preferences.learningLanguageID = elements.languageSelect.value;
  state.preferences.meaningLanguage = elements.meaningLanguageSelect.value;
  state.preferences.sessionMinutes = parseInt(elements.sessionLength.value) || 15;
  state.preferences.interests = document.getElementById('userInterests')?.value || '';

  state.apiConfig.provider = elements.aiProviderSelect.value;
  state.apiConfig.model = elements.modelInput.value;

  // Read API key from input if provided
  const apiKey = elements.apiKeyInput.value.trim();
  if (apiKey) {
    state.apiConfig.apiKey = apiKey
    localStorage.setItem('muralApiKey', apiKey);
  }

  // Save preferences
  localStorage.setItem('muralPrefs', JSON.stringify(state.preferences));
  
  // If language changed, restart session
  if (state.session && state.session.languageID !== state.preferences.learningLanguageID) {
    startNewSession();
  }
  
  closeModal();
  showToast('Settings saved!');
}

// Data import/export
function exportData() {
  const data = {
    session: state.session,
    preferences: state.preferences,
    learner: state.learner,
    exportedAt: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mural-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function importData() {
  showModal('Import Data', `
    <div>
      <p>Paste your exported JSON data below:</p>
      <textarea id="importDataText" style="width: 100%; height: 150px; margin: 10px 0;"></textarea>
      <div>
        <button id="confirmImport" class="settings-btn primary">Import</button>
        <button id="cancelImport" class="settings-btn">Cancel</button>
      </div>
    </div>
  `);
  
  setTimeout(() => {
    document.getElementById('confirmImport').addEventListener('click', () => {
      try {
        const data = JSON.parse(document.getElementById('importDataText').value);
        // Validate and restore
        if (data.session) {
          state.session = createSessionRecord({
            languageID: data.session.languageID,
            themeID: data.session.themeID,
            title: data.session.title
          });
          // Simplified restoration - in reality would be more thorough
          state.session.fragments = data.session.fragments || [];
          state.session.assessments = data.session.assessments || [];
          state.session.translations = data.session.translations || {};
          state.session.topics = data.session.topics || [];
          state.session.startedAt = new Date(data.session.startedAt);
          if (data.session.endedAt) state.session.endedAt = new Date(data.session.endedAt);
        }
        if (data.preferences) state.preferences = data.preferences;
        if (data.learner) state.learner = data.learner;
        
        localStorage.setItem('muralSession', JSON.stringify(state.session));
        localStorage.setItem('muralPrefs', JSON.stringify(state.preferences));
        
        closeModal();
        showToast('Data imported successfully!');
        renderViews();
        renderWordsList();
      } catch (error) {
        showModal('Import Error', `<p>Failed to import data: ${error.message}</p>`);
      }
    });
    
    document.getElementById('cancelImport').addEventListener('click', closeModal);
  }, 100);
}

function clearData() {
  if (confirm('Are you sure you want to clear all learning data? This cannot be undone.')) {
    localStorage.removeItem('muralSession');
    localStorage.removeItem('muralPrefs');
    state.session = null;
    state.preferences = createPreferences();
    state.learner = null;
    startNewSession();
    renderViews();
    renderWordsList();
    showToast('All data cleared');
  }
}

// Mic simulation (real implementation would use Web Speech API)
function toggleMic() {
  elements.micBtn.classList.toggle('active');
  if (elements.micBtn.classList.contains('active')) {
    elements.micBtn.textContent = '⏹️';
    // In real app: start speech recognition
    showToast('Listening... (speech recognition not implemented in demo)');
  } else {
    elements.micBtn.textContent = '🎤';
    // In real app: stop speech recognition
    showToast('Stopped listening');
  }
}

// UI helpers
function showModal(title, content) {
  elements.modalTitle.textContent = title;
  elements.modalContent.innerHTML = content;
  elements.modalOverlay.classList.add('active');
}

function closeModal() {
  elements.modalOverlay.classList.remove('active');
}

function showToast(message) {
  // Simple toast implementation
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '20px';
  toast.style.zIndex = '1000';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s';
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }, 100);
}

// Render functions
function renderViews() {
  // Update talk view header if needed
  if (state.session) {
    const lang = LanguageRegistry.module(state.session.languageID);
    const theme = conversationThemes.find(t => t.id === state.session.themeID);
    // Could update header with language/theme info
  }
  
  // Render words list
  renderWordsList();
}

// Save session
function saveSession() {
  if (!state.session) return;
  
  // Simplified session saving
  const sessionData = {
    id: state.session.id,
    languageID: state.session.languageID,
    themeID: state.session.themeID,
    title: state.session.title,
    fragments: state.session.fragments,
    assessments: state.session.assessments,
    translations: state.session.translations,
    topics: state.session.topics,
    startedAt: state.session.startedAt.getTime(),
    endedAt: state.session.endedAt ? state.session.endedAt.getTime() : null
  };
  
  localStorage.setItem('muralSession', JSON.stringify(sessionData));
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', init);
