// Ported from Themes.swift
// 24 conversation themes for Mural

export function createTheme(id, title, subtitle, symbol, category, situation, colorIndex) {
  return { id, title, subtitle, symbol, category, situation, colorIndex };
}

export const conversationThemes = [
  createTheme("coffee", "A coffee?", "Something warm, please", "☕", "Everyday", "You work in a cosy café. Help the learner order, then chat naturally.", 0),
  createTheme("weekend", "The weekend", "Tell me about yours", "🌅", "Connection", "Ask about the learner's weekend. Practise past events and follow their interests.", 1),
  createTheme("walk", "A little walk", "Out into the fresh air", "🌲", "Local life", "Take an imagined forest walk together. Talk about nature, weather and daily life.", 2),
  createTheme("dinner", "Dinner plans", "Let's make something", "🍴", "Everyday", "Plan dinner together. Ask about ingredients, preferences and the steps of cooking.", 3),
  createTheme("introductions", "Nice to meet you", "Start somewhere small", "👋", "Connection", "Meet the learner for the first time. Learn their interests through natural introductions.", 0),
  createTheme("groceries", "At the market", "Find the good tomatoes", "🧺", "Everyday", "Help the learner shop at a local food market. Practise quantities and questions.", 2),
  createTheme("travel", "Next stop", "A ticket to somewhere", "🚊", "Everyday", "Plan a train trip. Discuss routes and tickets without inventing real current schedules.", 1),
  createTheme("home", "A place of your own", "Make yourself at home", "🏠", "Everyday", "Discuss a home, rooms, moving and what makes a place comfortable.", 3),
  createTheme("friends", "New friends", "An invitation, maybe", "👥", "Connection", "You are a friendly new acquaintance. Arrange something to do together.", 0),
  createTheme("work", "Monday morning", "Around the office", "💼", "Everyday", "Chat as colleagues. Discuss work, meetings and a small problem to solve.", 1),
  createTheme("weather", "Rain again?", "Whatever the weather", "🌧️", "Local life", "Talk about weather, clothing and outdoor plans. Do not claim today's forecast without sources.", 1),
  createTheme("cabin", "A weekend away", "A quieter kind of day", "⛰️", "Local life", "Plan a weekend away: travel, food, walks and relaxing together.", 2),
  createTheme("music", "On repeat", "What are you listening to?", "🎵", "Interests", "Ask about music the learner enjoys. Explore feelings, favourites and concerts.", 0),
  createTheme("film", "One more episode", "Something worth watching", "🎬", "Interests", "Discuss films and series. Ask for opinions and avoid unwanted spoilers.", 1),
  createTheme("books", "Between the pages", "A story that stayed", "📚", "Interests", "Chat about books, characters, stories and why they matter to the learner.", 3),
  createTheme("design", "Good things", "Made with a little care", "✏️", "Interests", "Explore design, architecture and objects the learner loves. Ask for concrete opinions.", 0),
  createTheme("technology", "What comes next", "Ideas, tools and tomorrow", "✨", "Interests", "Discuss technology and how it changes daily life. Delegate claims needing current facts.", 1),
  createTheme("travelstories", "Somewhere else", "A place you remember", "🌍", "Interests", "Exchange travel stories and dream destinations. Invite descriptions and comparisons.", 2),
  createTheme("restaurant", "A table for two", "Stay for dessert", "🍷", "Everyday", "Role-play a restaurant meal. Practise requests, preferences and polite problem-solving.", 0),
  createTheme("neighbours", "Next door", "A familiar face", "🏢", "Connection", "Chat as neighbours. Discuss the neighbourhood and small requests for help.", 3),
  createTheme("traditions", "Everyday customs", "Small customs, big stories", "🚩", "Local life", "Explore everyday customs with nuance. Avoid treating a whole culture as alike.", 2),
  createTheme("opinions", "What do you think?", "Room for another view", "💬", "Connection", "Choose an everyday dilemma. Invite reasons and gently explore another perspective.", 1),
  createTheme("future", "A year from now", "Plans worth talking about", "✈️", "Connection", "Talk about hopes and future plans. Explore possibilities and practical next steps.", 3),
  createTheme("today", "The world today", "Something to talk about", "📰", "Interests", "Ask what current topic interests the learner, then delegate a source-backed lookup before discussing facts.", 0)
];

export function getTheme(id) {
  return conversationThemes.find(t => t.id === id) || conversationThemes[0];
}
