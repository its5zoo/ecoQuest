const { GoogleGenAI } = require('@google/genai');

let ai = null;

/**
 * Dynamically gets or initializes the Google Gen AI client.
 * Trims any trailing carriage returns or spaces from the key.
 */
function getAI() {
  if (ai) return ai;
  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = rawKey ? rawKey.trim() : null;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    ai = new GoogleGenAI({ apiKey });
    console.log(`🌿 Gemini AI client initialized dynamically (key length: ${apiKey.length})`);
  }
  return ai;
}

/**
 * Safely parses JSON response from Gemini, handling potential markdown fences and extra text
 * @param {string} text - Raw response text
 * @returns {any} Parsed JSON object/array, or null if parsing fails
 */
function cleanAndParseJSON(text) {
  if (!text) return null;
  let cleaned = text.trim();
  
  // Strip markdown code fences if present
  if (cleaned.includes('```json')) {
    cleaned = cleaned.split('```json')[1].split('```')[0].trim();
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.split('```')[1].split('```')[0].trim();
  }
  
  // Find first occurrence of '{' or '[' to extract JSON structure
  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstObject !== -1 && (firstArray === -1 || firstObject < firstArray)) {
    startIdx = firstObject;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstArray !== -1) {
    startIdx = firstArray;
    endIdx = cleaned.lastIndexOf(']');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse clean JSON:', e.message, 'Cleaned text:', cleaned);
    return null;
  }
}

class AIService {
  /**
   * Generates a dynamic, personalized insight based on a user's recent activities
   * @param {Array} activities - List of user's recent activities
   * @returns {string} The AI generated insight
   */
  static async generateInsight(activities) {
    const aiClient = getAI();
    if (!aiClient) return "Log activities to track your footprint! (AI offline)";

    if (!activities || activities.length === 0) {
      return "Log some activities to get personalized eco-insights!";
    }

    // Summarize activities to send to the prompt
    const summary = activities.map(a => `${a.quantity || a.duration || 1} units of ${a.activityType} (${a.category}) generating ${a.co2Generated}kg CO2`).join(', ');

    const prompt = `
      You are an expert environmental consultant and friendly eco-coach for an app called EcoQuest.
      The user has recently logged the following activities:
      ${summary}
      
      Provide a very short (max 2 sentences), encouraging, and actionable insight based on this data. 
      Focus on their biggest emission source and suggest a practical way to reduce it. Do not use markdown.
    `;

    try {
      // Use the standard gemini-2.5-flash model for general text generation
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "Keep up the great work tracking your footprint!";
    }
  }

  /**
   * Recommends 3 personalized quests for the user to complete
   * @param {Array} activities - Recent user activities
   */
  static async recommendQuests(activities) {
    const aiClient = getAI();
    if (!aiClient) {
      return [
        { title: "First Step", description: "Log your first activity to start your journey.", type: "general", difficulty: "easy" }
      ];
    }

    if (!activities || activities.length === 0) {
      return [
        { title: "First Step", description: "Log your first activity to start your journey.", type: "general", difficulty: "easy" }
      ];
    }

    const summary = activities.map(a => `${a.activityType} (${a.category})`).join(', ');

    const prompt = `
      Based on the user's recent activities: ${summary}.
      Generate exactly 3 short, actionable quests for tomorrow to help them reduce their carbon footprint.
      Return the result as a valid JSON array of objects with the following keys:
      - title (string, max 30 chars)
      - description (string, max 80 chars)
      - type (string, one of: transport, energy, food, waste)
      - difficulty (string, one of: easy, medium, hard)
    `;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return cleanAndParseJSON(response.text) || [];
    } catch (error) {
      console.error('Error calling Gemini API for quests:', error);
      return [];
    }
  }

  /**
   * Handles interactive chat with the user
   * @param {Array} messageHistory - Array of previous messages [{role, content}]
   * @param {Object} userContext - Context about the user's current state
   */
  static async chat(messageHistory, userContext = {}) {
    const aiClient = getAI();
    if (!aiClient) {
      return "AI Assistant is currently offline. Please ensure your Gemini API key is configured.";
    }

    const systemPrompt = `
You are EcoBot, a friendly and knowledgeable AI assistant for the "EcoQuest" carbon tracker app.
You have a green footprint avatar with an "AI" badge.

STRICT RULES:
1. You MUST ONLY answer questions related to the EcoQuest app, carbon footprints, sustainability, climate change, or eco-friendly habits.
2. If the user asks about ANYTHING ELSE (e.g., coding, math, general knowledge, movies, politics), you MUST reply exactly with some variation of: "Sorry, I can only help with questions related to your carbon footprint or the EcoQuest app!"
3. Be friendly, encouraging, and concise. Do not give overly long answers unless asked.

USER CONTEXT:
- Name: ${userContext.name || 'User'}
- District: ${userContext.district || 'Not specified'}
- Total XP: ${userContext.totalXP || 0}
- Carbon Saved: ${userContext.carbonSaved || 0} kg CO2
- Today's Emissions: ${userContext.dailyTotal || 0} kg CO2

If the user wants to log an activity, tell them to visit the "Tracker" page.
If they want to see how they compare to others, tell them to visit the "Community" page.
If they want to calculate their overall footprint, tell them to visit the "Calculator" page.
`;

    // Format conversation history
    const conversation = messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'EcoBot'}: ${msg.content}`).join('\n');
    
    const prompt = `${systemPrompt}\n\nConversation History:\n${conversation}\n\nEcoBot:`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API for chat:', error);
      return "Sorry, my circuits are a bit overloaded right now! Please try again in a moment.";
    }
  }

  /**
   * Moderates a post before sending/saving it
   * @param {string} content - The content of the post to moderate
   */
  static async moderatePost(content) {
    const aiClient = getAI();
    if (!aiClient) {
      return { isValid: false, reason: 'Moderation service is temporarily unavailable. Please try again later.' };
    }

    const prompt = `
      You are an automated moderation filter for the "EcoQuest" app's Community Feed.
      
      Guidelines:
      1. Content should relate to nature, environment, sustainability, eco-friendly habits, community projects, or social/environmental work.
      2. Allow introductions: If a user is introducing themselves (e.g. "Hello am a social worker", "Hi, I am new to the community"), this is VALID and allowed.
      3. Address/Location sharing: Users are allowed to share high-level address details (e.g., street, city, state, or neighborhood). However, for privacy/safety, do NOT allow highly specific personal info like a specific door number, building number, house number, phone number, or email.
      4. Forbid: extreme violence, vulgarity/profanity, political mudslinging, commercial spam/advertising, or illegal acts.
      
      Analyze the following proposed post text:
      "${content}"
 
      Return a JSON object with:
      - isValid (boolean): true if it complies with these guidelines, false otherwise.
      - reason (string): If isValid is false, explain clearly, politely, and specifically why it was rejected (e.g., if it contains a private door number/phone number, or if it is completely off-topic spam/vulgarity). Leave as an empty string if isValid is true.
    `;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return cleanAndParseJSON(response.text) || { isValid: false, reason: 'Unable to verify content. Please try again.' };
    } catch (error) {
      console.error('Error calling Gemini API for moderation:', error);
      return { isValid: false, reason: 'Moderation service error. Please try again later.' };
    }
  }

  /**
   * Fetches real, live environmental news using Google Search grounding
   * @param {string} query - The search query
   */
  static async fetchLiveNews(query) {
    const aiClient = getAI();
    if (!aiClient) {
      return []; // Return empty if AI client offline
    }

    const searchTerm = query && query.trim() ? query.trim() : 'environmental news climate change sustainability';

    const prompt = `
      You are a specialized environmental news aggregator. Perform a web search and fetch the 6 most recent, real, and authentic news articles, reports, or scientific updates about climate change, carbon emissions, pollution, renewable energy, or sustainability, specifically matching this search term: "${searchTerm}".
      
      For each article, extract/provide:
      - id (string, unique sequential number or slug)
      - title (string, article headline)
      - description (string, 1-2 sentence summary of the article)
      - url (string, real link to the source article or news portal)
      - source (string, name of the news publisher e.g. BBC, Reuters, NASA, etc.)
      - publishedAt (string, ISO date string of publication)
      - image (string, a real Unsplash environmental/nature image URL related to the topic, e.g. "https://images.unsplash.com/photo-...")
      - category (string, one of: climate, carbon, pollution, sustainability)
      
      Return the result strictly as a valid JSON array of objects with these keys. Do not include markdown formatting or backticks.
    `;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "text/plain" // EXPLICITLY set to text/plain to avoid 400 error with Google Search tool
        }
      });

      return cleanAndParseJSON(response.text) || [];
    } catch (error) {
      console.error('Error fetching live news via Gemini:', error);
      return [];
    }
  }

  /**
   * Explains an environmental / carbon-footprint topic with rich structured data.
   * Returns { isEnvironmental:true, title, emoji, overview, sections[], facts[], co2Impact, actionTips[] }
   * or { isEnvironmental: false } ONLY for clearly non-environmental topics.
   * @param {string} query - User's search term
   */
  static async explainEnvTopic(query) {
    const aiClient = getAI();
    if (!aiClient) {
      return { isEnvironmental: false, error: 'AI offline' };
    }

    const q = (query || '').trim();
    if (!q) return { isEnvironmental: false };

    const prompt = `
You are a senior environmental scientist and educator for an eco-tracking app called EcoQuest.

A user typed this search: "${q}"

YOUR TASK:
You must answer as an environmental expert. Treat the query with a very broad, inclusive definition of "environmental topic". 

ALWAYS return isEnvironmental:true for ANYTHING related to:
- Any type of pollution (air, water, soil, noise, light, plastic, chemical, industrial, thermal, nuclear)
- Climate, weather, atmosphere, global warming, greenhouse effect
- Carbon dioxide, CO₂, methane, greenhouse gases, emissions, carbon footprint
- Energy (fossil fuels, coal, oil, gas, solar, wind, hydro, nuclear, renewable, clean energy)
- Ecology, biodiversity, species, animals, plants, forests, trees, jungles, wetlands
- Oceans, rivers, lakes, groundwater, water pollution, water scarcity
- Sustainability, green living, eco-friendly, recycling, waste, composting
- Environmental policies, climate agreements, Paris Agreement, Kyoto Protocol
- Nature, wildlife, conservation, extinction, endangered species
- Soil, land degradation, desertification, erosion
- Food systems, agriculture, farming, pesticides, organic farming
- Urban environment, city planning, green buildings
- Health effects of environment, environmental diseases
- Chemicals, toxins, heavy metals in environment

ONLY return isEnvironmental:false for completely unrelated topics like:
- Sports (cricket, football, etc.)
- Entertainment, movies, music, celebrities
- Cooking recipes (unless about sustainable/organic food)
- Mathematics, pure science unrelated to environment
- Programming, technology (unless about clean tech)
- History, politics unrelated to environment

Since "${q}" is being searched on an environmental knowledge platform, assume it IS environmental unless it is obviously one of the clearly unrelated categories above.

RESPONSE FORMAT:
If environmental, return this JSON (no markdown, no backticks):
{
  "isEnvironmental": true,
  "title": "<proper topic title>",
  "emoji": "<1 fitting emoji>",
  "category": "<one of: Climate, Carbon, Atmosphere, Biodiversity, Ocean, Pollution, Solutions, Energy, Water, Soil, Health>",
  "color": "<hex color matching category e.g. #EF4444 for pollution, #10B981 for solutions, #0EA5E9 for water>",
  "overview": "<2-3 sentence clear overview that an educated 16-year-old can understand>",
  "sections": [
    { "heading": "What is it?",   "content": "<2-4 clear sentences explaining the concept>" },
    { "heading": "Key Causes",    "content": "<4-6 bullet points, each starting with •>" },
    { "heading": "Impacts",       "content": "<4-6 bullet points starting with •, covering health, environment, economy>" },
    { "heading": "Solutions",     "content": "<4-6 bullet points starting with •, practical and achievable>" }
  ],
  "facts": ["<surprising/important fact 1>", "<fact 2>", "<fact 3>"],
  "co2Impact": "<1 sentence on CO₂ or GHG connection, or empty string>",
  "actionTips": ["<simple personal action 1>", "<action 2>", "<action 3>"]
}

If clearly NOT environmental:
{"isEnvironmental": false}

Return ONLY valid JSON. No extra text, no explanation.
`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      return cleanAndParseJSON(response.text) || { isEnvironmental: false };
    } catch (error) {
      console.error('Error explaining env topic:', error.message);
      // On any parse/API error, return not-found rather than crashing
      return { isEnvironmental: false, error: error.message };
    }
  }

  /**
   * Environmental AI Chat — answers user questions about environment/carbon.
   * Rejects non-environmental questions politely.
   * @param {string} question - Latest user question
   * @param {Array} history - [{role:'user'|'assistant', content:string}] prior messages
   * @returns {string} AI answer text
   */
  static async envChatAnswer(question, history = []) {
    const aiClient = getAI();
    if (!aiClient) {
      return "🌿 EcoGuide is currently offline. Please check your API key configuration.";
    }

    // Build conversation context from prior messages (last 10 for context window)
    const recentHistory = history.slice(-10);
    const conversationLines = recentHistory.map(m =>
      `${m.role === 'user' ? 'User' : 'EcoGuide'}: ${m.content}`
    ).join('\n');

    const prompt = `You are EcoGuide, an expert AI assistant exclusively dedicated to environmental topics for the EcoQuest platform.

YOUR SCOPE — Only answer questions about:
• Climate change, global warming, greenhouse effect
• Carbon footprint, CO₂ emissions, carbon credits, net zero
• Any type of pollution (air, water, soil, plastic, noise, chemical)
• Renewable energy (solar, wind, hydro, geothermal, biomass)
• Ecology, biodiversity, forests, oceans, wildlife, species
• Sustainability, recycling, waste management, composting
• Environmental laws, policies, treaties (Paris Agreement, Kyoto)
• Environmental health, toxins, pesticides
• Indian environmental context (Ganga, Delhi pollution, NGT, etc.)

IF the user asks something COMPLETELY unrelated (sports, movies, coding, maths, recipes), reply ONLY with:
"🌿 I'm EcoGuide — I can only answer questions about the environment, climate change, carbon footprint, and sustainability. Please ask me something related to these topics!"

STRICT STYLE & LANGUAGE RULES:
- Use very simple, clear, and beginner-friendly English. Keep sentences short.
- Avoid using complex scientific terms or jargon. If you must use a term, explain it in very simple words.
- Provide a direct and well-structured answer. Focus exactly on what the user wants to know.
- Keep explanations brief and to-the-point. Only provide a little extra explanation if it's really helpful.

FORMATTING:
- Use clear, readable plain text
- Use bullet points (•) for lists. Bold the key terms in the bullets using markdown double asterisks, like: "• **Vehicular Emissions:** A major cause..."
- Use section headings in CAPS where helpful (no markdown formatting for headings, just plain ALL CAPS)
- End responses with one actionable tip for the user prefixed with "💡 Tip:"
- Keep responses under 300 words.

PREVIOUS CONVERSATION:
${conversationLines || '(This is the start of the conversation)'}

User: ${question}
EcoGuide:`;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return (response.text || '').trim();
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        console.warn('EnvChat AI quota exceeded');
      } else {
        console.error('EnvChat AI error:', msg.substring(0, 200));
      }
      return "Message can't be generated right now. Please try again later.";
    }
  }
}

module.exports = AIService;
