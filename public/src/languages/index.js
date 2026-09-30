// Ported from LanguageModule.swift + LanguageRegistry
// All 8 language modules for Mural

function createLanguage({ id, name, nativeName, variety, locale, greeting, greetingWord, speechGuidance, writingGuidance, lemmaGuidance, teachingFocus, topicPlaceholder, lookupUnavailableReply, themeOverrides }) {
  return {
    id, name, nativeName, variety, locale, greeting, greetingWord,
    speechGuidance, writingGuidance, lemmaGuidance, teachingFocus,
    topicPlaceholder, lookupUnavailableReply, themeOverrides: themeOverrides || {},
    get defaultTitle() { return `A little ${name}`; },
    get talkTitle() { return `A little everyday ${name}`; },
    get settingsTitle() { return `${name} · ${variety}`; }
  };
}

function createTheme(id, title, subtitle, symbol, category, situation, colorIndex) {
  return { id, title, subtitle, symbol, category, situation, colorIndex };
}

const norwegian = createLanguage({
  id: 'nb',
  name: 'Norwegian',
  nativeName: 'Bokmål',
  variety: 'Eastern Norway',
  locale: 'nb-NO',
  greeting: 'Hei!',
  greetingWord: 'hei',
  speechGuidance: 'Use clear, natural Eastern Norwegian pronunciation. Pay attention to pitch accents and vowel distinctions that affect meaning. Accept standard written Bokmål and conservative pronunciation without treating dialectal or regional variation as error.',
  writingGuidance: 'Use standard Bokmål orthography and punctuation.',
  lemmaGuidance: 'Give vocabulary lemmas in standard Bokmål dictionary form. Preserve meaningful chunks such as "å gå" and "ha lyst til". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Greetings, introductions and useful everyday chunks such as 'jeg heter' and 'jeg vil gjerne'.",
    "Everyday questions, word order, basic verb tenses and common present-time exchanges.",
    "Connected stories, past tense, opinions and familiar situations with details.",
    "Reasons and explanations, compound sentences, polite requests and natural linking phrases.",
    "Nuance, subordinate clauses, idiomatic phrasing, register and regional variation.",
    "Flexible advanced discussion with precise, natural Norwegian and appropriate register."
  ],
  topicPlaceholder: "Mat, reiser, filmer, hverdagsliv…",
  lookupUnavailableReply: "Jeg kan ikke slå opp det akkurat nå. Hvis du vil, kan vi snakke om temaet generelt først."
});

const spanish = createLanguage({
  id: 'es',
  name: 'Spanish',
  nativeName: 'Español',
  variety: 'Spain',
  locale: 'es-ES',
  greeting: '¡Hola!',
  greetingWord: 'hola',
  speechGuidance: 'Use clear, natural Castilian Spanish pronunciation. Pay attention to the distinction between /s/ and /θ/, and verb conjugations that affect meaning. Accept valid regional accents and vocabulary without treating a regional difference alone as an error.',
  writingGuidance: 'Use standard Spanish orthography and punctuation, including opening question and exclamation marks where appropriate.',
  lemmaGuidance: 'Give vocabulary lemmas in standard Spanish infinitive or masculine singular form. Preserve meaningful chunks such as "tener que" and "echar de menos". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Saludos, presentaciones y frases útiles cotidianas como 'me llamo' y 'quiero'.",
    "Preguntas cotidianas, concordancia, verbos en presente e intercambios comunes.",
    "Historias conectadas, pretérito perfecto e indefinido, opiniones y situaciones familiares con detalles.",
    "Razones y explicaciones, oraciones compuestas, subjuntivo en contextos habituales y frases de enlace.",
    "Matices, condicional, perífrasis verbales, registro y variación regional.",
    "Conversación avanzada y flexible con español preciso y natural y registro apropiado."
  ],
  topicPlaceholder: "Comida, viajes, películas, vida cotidiana…",
  lookupUnavailableReply: "No puedo consultar eso ahora mismo. Si quieres, podemos hablar del tema en general primero."
});

const english = createLanguage({
  id: 'en',
  name: 'English',
  nativeName: 'English',
  variety: 'International',
  locale: 'en-US',
  greeting: 'Hi!',
  greetingWord: 'hi',
  speechGuidance: 'Use clear, natural International English pronunciation in a neutral standard accent. Accept major standard varieties (American, British, Australian, Canadian, Irish) without treating one as more correct. Do not imitate a regional caricature.',
  writingGuidance: 'Use standard English orthography and punctuation. Accept both -ise and -ize spellings, and both single and double quotation marks, without correction.',
  lemmaGuidance: 'Give vocabulary lemmas in standard English dictionary form. Preserve phrasal verbs and multi-word units such as "look after" and "get used to". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Greetings, introductions and useful everyday chunks such as 'my name is' and 'I would like'.",
    "Everyday questions, basic tenses, word order and common present-time exchanges.",
    "Connected stories, past narrative, opinions and familiar situations with details.",
    "Reasons and explanations, complex sentences, modals and natural linking phrases.",
    "Nuance, conditionals, idiomatic phrasing, register and regional variation.",
    "Flexible advanced discussion with precise, natural English and appropriate register."
  ],
  topicPlaceholder: "Food, travel, films, everyday life…",
  lookupUnavailableReply: "I can't look that up right now. If you like, we can talk about the topic in general first."
});

const french = createLanguage({
  id: 'fr',
  name: 'French',
  nativeName: 'Français',
  variety: 'France',
  locale: 'fr-FR',
  greeting: 'Bonjour !',
  greetingWord: 'bonjour',
  speechGuidance: 'Use clear, natural Metropolitan French pronunciation. Pay attention to nasal vowels, liaison and euphony that affect meaning. Accept valid regional accents and vocabulary without treating a regional difference or non-native accent alone as an error.',
  writingGuidance: 'Use standard French orthography and punctuation, including non-breaking spaces before certain punctuation marks where convention requires them.',
  lemmaGuidance: 'Give vocabulary lemmas in standard French infinitive or masculine singular form. Preserve pronominal verbs and meaningful chunks such as "s\'appeler" and "avoir envie de". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Salutations, présentations et expressions utiles quotidiennes comme 'je m\'appelle' et 'je voudrais'.",
    "Questions quotidiennes, conjugaison au présent, genre et accords, échanges courants.",
    "Récits au passé composé et à l'imparfait, opinions et situations familières détaillées.",
    "Raisons et explications, phrases complexes, subjonctif dans des contextes courants et connecteurs logiques.",
    "Nuance, conditionnel, discours indirect, expressions idiomatiques et registres de langue.",
    "Conversation avancée et flexible avec un français précis et naturel et un registre approprié."
  ],
  topicPlaceholder: "Cuisine, voyages, films, vie quotidienne…",
  lookupUnavailableReply: "Je ne peux pas vérifier cela maintenant. Si vous voulez, nous pouvons d'abord parler du sujet en général."
});

const german = createLanguage({
  id: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  variety: 'Germany',
  locale: 'de-DE',
  greeting: 'Hallo!',
  greetingWord: 'hallo',
  speechGuidance: 'Use clear, natural Standard German pronunciation. Pay attention to case endings, verb position and articles that affect meaning. Accept valid regional accents and vocabulary without treating a regional difference alone as an error.',
  writingGuidance: 'Use standard German orthography and punctuation, including capitalisation of nouns. Accept reformed and traditional spelling rules without correction.',
  lemmaGuidance: 'Give vocabulary lemmas in standard German infinitive or nominative singular form. Preserve separable verbs and meaningful chunks such as "sich freuen auf" and "es gibt". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Begrüßungen, Vorstellungen und nützliche alltägliche Wendungen wie 'ich heiße' und 'ich möchte'.",
    "Alltagsfragen, Satzklammer, Präsens, Artikel und gängige Austauschsituationen.",
    "Zusammenhängende Erzählungen, Perfekt und Präteritum, Meinungen und vertraute Situationen mit Details.",
    "Begründungen und Erklärungen, Nebensätze mit 'weil' und 'dass', Modalverben und natürliche Verknüpfungen.",
    "Nuancen, Konjunktiv II, Passiv, idiomatische Wendungen, Register und regionale Variation.",
    "Flexible anspruchsvolle Unterhaltung mit präzisem, natürlichem Deutsch und angemessenem Register."
  ],
  topicPlaceholder: "Essen, Reisen, Filme, Alltag…",
  lookupUnavailableReply: "Das kann ich jetzt nicht nachschlagen. Wenn du möchtest, können wir erst einmal allgemein über das Thema sprechen."
});

const italian = createLanguage({
  id: 'it',
  name: 'Italian',
  nativeName: 'Italiano',
  variety: 'Italy',
  locale: 'it-IT',
  greeting: 'Ciao!',
  greetingWord: 'ciao',
  speechGuidance: 'Use clear, natural Standard Italian pronunciation. Pay attention to double consonants and vowel quality that affect meaning. Accept valid regional accents and vocabulary without treating a regional difference alone as an error.',
  writingGuidance: 'Use standard Italian orthography and punctuation. Accept regional variations in everyday vocabulary without correction.',
  lemmaGuidance: 'Give vocabulary lemmas in standard Italian infinitive or masculine singular form. Preserve reflexive verbs and meaningful chunks such as "avere voglia di" and "andare bene". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Saluti, presentazioni e frasi utili quotidiane come 'mi chiamo' e 'vorrei'.",
    "Domande quotidiane, presente indicativo, concordanza e scambi comuni.",
    "Racconti collegati, passato prossimo e imperfetto, opinioni e situazioni familiari con dettagli.",
    "Ragioni e spiegazioni, frasi complesse, congiuntivo in contesti comuni e connettivi naturali.",
    "Sfumature, condizionale, discorso indiretto, espressioni idiomatiche e registro.",
    "Conversazione avanzata e flessibile con italiano preciso e naturale e registro appropriato."
  ],
  topicPlaceholder: "Cibo, viaggi, film, vita quotidiana…",
  lookupUnavailableReply: "Non posso verificarlo ora. Se vuoi, possiamo prima parlare dell'argomento in generale."
});

const portuguese = createLanguage({
  id: 'pt',
  name: 'Portuguese',
  nativeName: 'Português',
  variety: 'Brazil',
  locale: 'pt-BR',
  greeting: 'Olá!',
  greetingWord: 'olá',
  speechGuidance: 'Use clear, natural Brazilian Portuguese pronunciation. Pay attention to nasal vowels, open and close vowel quality and the rhythm of connected speech that affect meaning. Accept valid regional accents and vocabulary without treating a regional difference alone as an error.',
  writingGuidance: 'Use standard Brazilian Portuguese orthography and punctuation following the latest Orthographic Agreement.',
  lemmaGuidance: 'Give vocabulary lemmas in standard Brazilian Portuguese infinitive or masculine singular form. Preserve verb phrases and meaningful chunks such as "estar com vontade de" and "dar certo". Provide the observed form and exact quote as they appear in the transcript.',
  teachingFocus: [
    "Saudações, apresentações e frases úteis cotidianas como 'me chamo' e 'gostaria de'.",
    "Perguntas cotidianas, presente do indicativo, concordância e trocas comuns.",
    "Histórias conectadas, pretérito perfeito e imperfeito, opiniões e situações familiares com detalhes.",
    "Razões e explicações, frases complexas, subjuntivo em contextos comuns e conectores naturais.",
    "Nuances, condicional, voz passiva, expressões idiomáticas e registro.",
    "Conversa avançada e flexível com português preciso e natural e registro apropriado."
  ],
  topicPlaceholder: "Comida, viagens, filmes, vida cotidiana…",
  lookupUnavailableReply: "Não posso verificar isso agora. Se quiser, podemos primeiro conversar sobre o assunto em geral."
});

const mandarin = createLanguage({
  id: 'zh',
  name: 'Mandarin Chinese',
  nativeName: '普通话',
  variety: 'Mainland China',
  locale: 'zh-CN',
  greeting: '你好！',
  greetingWord: '你好',
  speechGuidance: 'Use clear, natural Standard Mandarin pronunciation. Treat tones, tone changes, retroflex and non-retroflex sounds, and distinctions between initials and finals as meaningful when they affect understanding. Accept valid regional accents and vocabulary without treating a regional difference or a non-native accent alone as an error. Do not imitate a regional caricature.',
  writingGuidance: 'Use natural Simplified Chinese and standard modern punctuation. Prefer everyday Mainland usage while accepting valid regional wording and Traditional Chinese input. Keep Chinese text free of unnecessary spaces. The app displays pinyin separately; do not append pinyin or translations to ordinary spoken replies. Explain characters and tones briefly in Mandarin when asked.',
  lemmaGuidance: 'Give vocabulary lemmas in simplified characters only, with no pinyin or English in the lemma; the app supplies pronunciation help separately. Keep the exact observed form and quote, including Traditional Chinese or learner-written pinyin. Use dictionary forms and preserve meaningful chunks such as 洗澡 and 见面. Do not infer tone accuracy, pronunciation or spoken recall from typed pinyin or a transcript alone.',
  teachingFocus: [
    "问候、自我介绍和日常常用语，比如“我叫”和“我想要”。",
    "日常问题、语序、量词、数字和常见的现在时交流。",
    "连贯的叙述、完成体“了”、经历体“过”、以及熟悉场景中带有细节的表达。",
    "理由和观点、比较句、“把”字句和“被”字句、以及自然的连接表达。",
    "细微差别、体貌、条件句、习惯用语、语体和地域变体。",
    "灵活的高级讨论，使用准确自然的中文和恰当的语体。"
  ],
  topicPlaceholder: "美食、旅行、电影、日常生活……",
  lookupUnavailableReply: "我现在没法查证这件事。如果你愿意，我们可以先聊聊这个话题的一般情况。",
  themeOverrides: {
    "coffee": createTheme("coffee", "喝杯咖啡？", "Something warm, please", "☕", "Everyday", "在一家社区咖啡馆见面。用普通话点饮料并聊天，跟着学习者的兴趣展开对话。", 0),
    "groceries": createTheme("groceries", "去买菜", "Find something good", "🧺", "Everyday", "在菜市场或超市买日常食材。练习数量、价格和礼貌的提问，尊重不同地区的食物词汇。", 2),
    "travel": createTheme("travel", "下一站", "A ticket to somewhere", "🚊", "Everyday", "用普通话计划一次旅行。讨论交通、方向和买票，不要编造当前的时刻表。", 1),
    "cabin": createTheme("cabin", "周末出游", "A change of scene", "⛰️", "Local life", "一起设想一个周末旅行，选择城市、海边或乡村，讨论实际安排和喜欢做的事情。", 2),
    "traditions": createTheme("traditions", "日常习俗", "Small customs, big stories", "🚩", "Local life", "用普通话聊日常习俗和节日。比较学习者熟悉的地方，避免把任何一种习惯说成所有人的共同体验。", 2)
  }
});

export const allLanguages = [norwegian, spanish, english, french, german, italian, portuguese, mandarin];

export const LanguageRegistry = {
  defaultID: 'zh', // Changed to Mandarin for your learning
  all: allLanguages,
  module(id) { return allLanguages.find(l => l.id === id) || null; }
};

export const MeaningLanguages = {
  all: ['English', 'French', 'German', 'Spanish', 'Norwegian', 'Portuguese', 'Italian', 'Chinese (Simplified)', 'Polish', 'Arabic', 'Ukrainian'],
  greeting(language) {
    const greetings = {
      'English': 'Hi!', 'French': 'Salut !', 'German': 'Hallo!', 'Spanish': '¡Hola!',
      'Norwegian': 'Hei!', 'Portuguese': 'Olá!', 'Italian': 'Ciao!',
      'Chinese (Simplified)': '你好！', 'Chinese': '你好！', 'Polish': 'Cześć!',
      'Arabic': 'مرحبًا!', 'Ukrainian': 'Привіт!'
    };
    return greetings[language] || 'Hi!';
  }
};
