import { CATEGORIES } from '../utils/carbonLogic';

/**
 * Simulated AI Engine
 * In a production app, this would send payload data to an LLM (e.g. Gemini/OpenAI).
 * For this MVP Phase 2, we use a robust heuristic rules engine to simulate intelligence.
 */

const AI_INSIGHTS = [
  {
    condition: (stats) => stats.Transport > 15,
    message: 'Your transport emissions are exceptionally high this week. Have you considered taking the train or carpooling for your daily commute?',
    category: 'Transport',
    type: 'alert'
  },
  {
    condition: (stats) => stats.Food > 10,
    message: 'We noticed a spike in food-related emissions. Swapping just two beef meals for plant-based options this week can save up to 13kg of CO₂!',
    category: 'Food',
    type: 'suggestion'
  },
  {
    condition: (stats, total) => total < 10,
    message: 'Incredible work! Your carbon footprint is 40% lower than your neighborhood average this week. Keep up the green habits!',
    category: 'General',
    type: 'praise'
  },
  {
    condition: (stats) => stats.Electricity > 20,
    message: 'Electricity usage is your biggest contributor right now. Unplugging idle devices and switching to LED bulbs can reduce this instantly.',
    category: 'Electricity',
    type: 'suggestion'
  }
];

export const generateSmartInsights = (weeklyActivities) => {
  if (!weeklyActivities || weeklyActivities.length === 0) {
    return [{ message: 'Log more activities to let the AI analyze your carbon footprint trends!', type: 'info', category: 'General' }];
  }

  // Aggregate by category
  const stats = {};
  let total = 0;
  weeklyActivities.forEach(a => {
    stats[a.category] = (stats[a.category] || 0) + a.carbonKg;
    total += a.carbonKg;
  });

  const generated = [];
  
  for (const rule of AI_INSIGHTS) {
    if (rule.condition(stats, total)) {
      generated.push({ message: rule.message, type: rule.type, category: rule.category });
    }
  }

  if (generated.length === 0) {
    generated.push({ 
      message: 'Your emissions are stable. The AI suggests focusing on reducing single-use plastics to further drop your footprint.', 
      type: 'suggestion', 
      category: 'Waste' 
    });
  }

  return generated;
};

export const generateLiveScoreMessage = (activity) => {
  const kg = activity.carbonKg.toFixed(1);
  const catName = CATEGORIES[activity.category]?.label || activity.category;
  
  const positiveTemplates = [
    `Great job! By choosing an eco-friendly ${catName} option, you saved potential emissions.`,
    `Every bit counts! Your ${catName} activity logged at just ${kg}kg CO₂.`
  ];
  
  const highImpactTemplates = [
    `Your ${catName} activity produced ${kg}kg CO₂. The AI suggests looking into low-carbon alternatives for next time.`,
    `A footprint of ${kg}kg CO₂ was added from ${catName}. Consider offsetting this with a planted tree!`
  ];

  if (activity.carbonKg > 5) {
    return highImpactTemplates[Math.floor(Math.random() * highImpactTemplates.length)];
  } else {
    return positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)];
  }
};
