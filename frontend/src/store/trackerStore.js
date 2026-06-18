import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { calcDailyScore, getLevel, generateSuggestions, CATEGORIES } from '../utils/carbonLogic';

// ── Tiered Badge System ──────────────────────────────────────
// tier: 1=Seedling 2=Guardian 3=Champion 4=Legend 5=Apex
// hidden: badge stays mystery until unlocked
const BADGES = [
  // ── TIER 1 — Seedling (0–499 XP) ─────────────────────────
  { id: 'first_step',    tier: 1, name: 'First Step',       icon: 'sprout',          tierColor: '#10B981', tierName: 'Seedling',
    desc: 'Log your very first activity',        hint: 'Log any 1 activity',          xpRequired: 0,    actRequired: 1,   streakRequired: 0, unlocked: false },
  { id: 'eco_curious',   tier: 1, name: 'Eco Curious',      icon: 'book-open',       tierColor: '#10B981', tierName: 'Seedling',
    desc: 'Read 3 environmental articles',       hint: 'Read 3 news articles',        xpRequired: 50,   actRequired: 0,   streakRequired: 0, unlocked: false },
  { id: 'low_carbon',    tier: 1, name: 'Clean Day',        icon: 'heart',           tierColor: '#10B981', tierName: 'Seedling',
    desc: 'Keep a daily carbon score under 30',  hint: 'Log a low-emission day',      xpRequired: 100,  actRequired: 3,   streakRequired: 0, unlocked: false },
  { id: 'walker',        tier: 1, name: 'Walker',           icon: 'footprints',      tierColor: '#10B981', tierName: 'Seedling',
    desc: 'Log 5 active transport activities',   hint: 'Walk or cycle 5 times',       xpRequired: 150,  actRequired: 5,   streakRequired: 0, unlocked: false },

  // ── TIER 2 — Guardian (500–1499 XP) ──────────────────────
  { id: 'green_week',    tier: 2, name: 'Green Week',       icon: 'leaf',            tierColor: '#06B6D4', tierName: 'Guardian',
    desc: 'Maintain a 7-day logging streak',     hint: 'Log every day for 7 days',    xpRequired: 500,  actRequired: 0,   streakRequired: 7,  unlocked: false },
  { id: 'cyclist',       tier: 2, name: 'Cyclist',          icon: 'bike',            tierColor: '#06B6D4', tierName: 'Guardian',
    desc: 'Log cycling 10 times',                hint: 'Log 10 cycling activities',   xpRequired: 600,  actRequired: 10,  streakRequired: 0,  unlocked: false },
  { id: 'plant_lover',   tier: 2, name: 'Plant Lover',      icon: 'tree-deciduous',  tierColor: '#06B6D4', tierName: 'Guardian',
    desc: 'Log 15 vegetarian or vegan meals',    hint: 'Choose plant-based 15 times', xpRequired: 700,  actRequired: 15,  streakRequired: 0,  unlocked: false },
  { id: 'streak_master', tier: 2, name: 'Streak Master',    icon: 'flame',           tierColor: '#06B6D4', tierName: 'Guardian',
    desc: 'Maintain a 14-day logging streak',    hint: 'Log every day for 2 weeks',   xpRequired: 900,  actRequired: 0,   streakRequired: 14, unlocked: false },

  // ── TIER 3 — Champion (1500–2999 XP) ─────────────────────
  { id: 'eco_warrior',   tier: 3, name: 'Eco Warrior',      icon: 'shield',          tierColor: '#8B5CF6', tierName: 'Champion',
    desc: 'Earn 1500 total XP',                  hint: 'Reach 1500 XP',              xpRequired: 1500, actRequired: 0,   streakRequired: 0,  unlocked: false },
  { id: 'solar_hero',    tier: 3, name: 'Solar Hero',       icon: 'sun',             tierColor: '#8B5CF6', tierName: 'Champion',
    desc: 'Reach Level 5 — Green Hero',          hint: 'Reach Level 5',              xpRequired: 2000, actRequired: 0,   streakRequired: 0,  unlocked: false },
  { id: 'forest_keeper', tier: 3, name: 'Forest Keeper',    icon: 'trees',           tierColor: '#8B5CF6', tierName: 'Champion',
    desc: 'Plant 5 trees in your Virtual Forest',hint: 'Accumulate 5 planted trees',  xpRequired: 2200, actRequired: 0,   streakRequired: 0,  unlocked: false },
  { id: 'month_streak',  tier: 3, name: 'Monthly Guardian', icon: 'calendar-check',  tierColor: '#8B5CF6', tierName: 'Champion',
    desc: 'Log every day for 30 days',           hint: 'Maintain a 30-day streak',   xpRequired: 2500, actRequired: 0,   streakRequired: 30, unlocked: false },

  // ── TIER 4 — Legend (3000–4999 XP) ───────────────────────
  { id: 'earth_guardian',tier: 4, name: 'Earth Guardian',   icon: 'globe',           tierColor: '#F59E0B', tierName: 'Legend',
    desc: 'Reach Level 7 — Earth Guardian',      hint: 'Reach Level 7',              xpRequired: 3000, actRequired: 0,   streakRequired: 0,  unlocked: false },
  { id: 'legend_100',    tier: 4, name: 'Century Eco',      icon: 'award',           tierColor: '#F59E0B', tierName: 'Legend',
    desc: 'Log 100 activities total',            hint: 'Log 100 activities in total', xpRequired: 3500, actRequired: 100, streakRequired: 0,  unlocked: false },

  // ── TIER 5 — Apex (5000+ XP) ─────────────────────────────
  { id: 'planet_sage',   tier: 5, name: 'Planet Sage',      icon: 'zap',             tierColor: '#EF4444', tierName: 'Apex',
    desc: 'Reach Level 9 — Eco Legend',          hint: 'Reach Level 9',              xpRequired: 5000, actRequired: 0,   streakRequired: 0,  unlocked: false },
  { id: 'climate_hero',  tier: 5, name: 'Climate Hero',     icon: 'star',            tierColor: '#EF4444', tierName: 'Apex',
    desc: 'Reach Level 10 — the ultimate rank!', hint: 'Reach Level 10 (Max)',       xpRequired: 15000,actRequired: 0,   streakRequired: 0,  unlocked: false },
];

// Full pool of possible daily quests
const QUEST_POOL = [
  { id: 'q_walk',  title: 'Walk 3km instead of driving',  category: 'transport', unit: 'km',   target: 3,  rewardXP: 50,  rewardCoins: 10, type: 'DAILY' },
  { id: 'q_bike',  title: 'Cycle 5km today',              category: 'transport', unit: 'km',   target: 5,  rewardXP: 60,  rewardCoins: 12, type: 'DAILY' },
  { id: 'q_bus',   title: 'Use public transport once',    category: 'transport', unit: 'trip', target: 1,  rewardXP: 30,  rewardCoins: 6,  type: 'DAILY' },
  { id: 'q_veg',   title: 'Log a vegetarian meal',        category: 'food',      unit: 'meal', target: 1,  rewardXP: 30,  rewardCoins: 5,  type: 'DAILY' },
  { id: 'q_plant', title: 'Eat 2 plant-based meals',      category: 'food',      unit: 'meal', target: 2,  rewardXP: 50,  rewardCoins: 10, type: 'DAILY' },
  { id: 'q_rec',   title: 'Recycle 3 plastic items',      category: 'waste',     unit: 'item', target: 3,  rewardXP: 40,  rewardCoins: 8,  type: 'DAILY' },
  { id: 'q_led',   title: 'Save 2 kWh of electricity',   category: 'energy',    unit: 'kWh',  target: 2,  rewardXP: 40,  rewardCoins: 8,  type: 'DAILY' },
  { id: 'q_shower','title': 'Take a short shower (<5min)', category: 'water',    unit: 'L',    target: 50, rewardXP: 25,  rewardCoins: 5,  type: 'DAILY' },
  { id: 'q_shop',  title: 'Avoid single-use plastic bag', category: 'waste',     unit: 'item', target: 1,  rewardXP: 20,  rewardCoins: 4,  type: 'DAILY' },
  { id: 'q_tree',  title: 'Log a tree planting activity', category: 'nature',    unit: 'tree', target: 1,  rewardXP: 80,  rewardCoins: 20, type: 'DAILY' },
];

function pickDailyQuests(dateStr) {
  // Deterministically pick 3 quests based on the date so everyone gets same daily quests
  const hash = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const h1 = (hash * a.id.charCodeAt(3)) % QUEST_POOL.length;
    const h2 = (hash * b.id.charCodeAt(3)) % QUEST_POOL.length;
    return h1 - h2;
  });
  return shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, completed: false }));
}

const useTrackerStore = create(
  persist(
    (set, get) => ({
      activities: [],
      totalXP: 0,
      streak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      badges: BADGES,
      lastLogDate: null,
      coins: 0,
      quests: pickDailyQuests(new Date().toDateString()),
      questDate: new Date().toDateString(),
      forestLevel: 1,
      plantedTrees: 0,
      readArticles: [],
      newsReadTodayCount: 0,
      newsReadDate: new Date().toDateString(),
      activityCoinsTodayCount: 0,
      activityCoinsDate: new Date().toDateString(),

      get dailyScore() {
        const today = new Date().toDateString();
        const todayActivities = get().activities.filter(
          a => new Date(a.timestamp).toDateString() === today
        );
        const totalKg = todayActivities.reduce((sum, a) => sum + a.carbonKg, 0);
        return calcDailyScore(totalKg);
      },

      get dailyTotal() {
        const today = new Date().toDateString();
        const todayActivities = get().activities.filter(
          a => new Date(a.timestamp).toDateString() === today
        );
        return todayActivities.reduce((sum, a) => sum + a.carbonKg, 0);
      },

      get level() {
        return getLevel(get().totalXP);
      },

      get suggestions() {
        const today = new Date().toDateString();
        const todayActivities = get().activities.filter(
          a => new Date(a.timestamp).toDateString() === today
        );
        return generateSuggestions(todayActivities);
      },

      addActivity: (activity) => {
        const today = new Date().toDateString();
        const lastDate = get().lastLogDate;
        
        // Streak logic
        let newStreak = get().streak;
        if (lastDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastDate === yesterday.toDateString()) {
            newStreak = newStreak + 1;
          } else if (lastDate !== today) {
            newStreak = 1;
          }
        }

        const newActivity = {
          ...activity,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString(),
        };

        const xpEarned = Math.max(10, Math.round((100 - calcDailyScore(activity.carbonKg * 10)) / 5));
        const newTotalXP = get().totalXP + xpEarned;

        // Level up tree planting logic
        const currentLevel = getLevel(get().totalXP).level;
        const nextLevel = getLevel(newTotalXP).level;
        let newPlantedTrees = get().plantedTrees;
        let newForestLevel = get().forestLevel;

        if (nextLevel > currentLevel) {
          newPlantedTrees += 1;
          newForestLevel = Math.min(10, Math.floor(newPlantedTrees / 3) + 1);
          toast.success(`🎉 LEVEL UP! You reached Level ${nextLevel}! A new tree has been planted in your Virtual Forest! 🌳`, { autoClose: 6000 });
        }

        // Unlock badges — check XP, streak, and actRequired
        const newActCount = get().activities.length + 1; // +1 for the activity being added
        const updatedBadges = get().badges.map(b => {
          if (b.unlocked) return b;
          const xpOk = newTotalXP >= b.xpRequired;
          const streakOk = b.streakRequired === 0 || newStreak >= b.streakRequired;
          const actOk = b.actRequired === 0 || newActCount >= b.actRequired;
          return { ...b, unlocked: xpOk && streakOk && actOk };
        });

        // First activity badge — force unlock on very first log
        if (get().activities.length === 0) {
          const idx = updatedBadges.findIndex(b => b.id === 'first_step');
          if (idx >= 0) updatedBadges[idx] = { ...updatedBadges[idx], unlocked: true };
        }

        // Update Quests progress — match category + add quantity
        const today2 = new Date().toDateString();
        let currentQuests = get().quests;
        // Auto-reset quests if it's a new day
        if (get().questDate !== today2) {
          currentQuests = pickDailyQuests(today2);
        }

        const activityCat = (activity.category || '').toLowerCase();
        const activityQty = parseFloat(activity.quantity) || 1;
        const activityUnit = (activity.unit || '').toLowerCase();

        let updatedQuests = currentQuests.map(q => {
          if (q.completed) return q;
          const questCat = (q.category || '').toLowerCase();
          if (questCat !== activityCat) return q;
          // Match unit when possible, otherwise count as 1 action
          const questUnit = (q.unit || '').toLowerCase();
          const increment = (questUnit && questUnit === activityUnit) ? activityQty : 1;
          const newProgress = Math.min(q.target, q.progress + increment);
          return { ...q, progress: parseFloat(newProgress.toFixed(2)) };
        });

        // Calculate coins for logging (Max 10 per day)
        let currentActivityCoins = get().activityCoinsDate === today ? get().activityCoinsTodayCount : 0;
        let coinsEarned = 0;
        if (currentActivityCoins < 10) {
          coinsEarned = Math.min(2, 10 - currentActivityCoins);
          currentActivityCoins += coinsEarned;
        }

        set((state) => ({
          activities: [newActivity, ...state.activities],
          totalXP: newTotalXP,
          coins: state.coins + coinsEarned,
          streak: newStreak,
          lastLogDate: today,
          badges: updatedBadges,
          quests: updatedQuests,
          questDate: today2,
          activityCoinsTodayCount: currentActivityCoins,
          activityCoinsDate: today,
          plantedTrees: newPlantedTrees,
          forestLevel: newForestLevel,
        }));

        // Sync activity to backend in background if user is authenticated
        try {
          import('./authStore').then(({ default: useAuthStore }) => {
            const token = useAuthStore.getState().token;
            if (token && token !== 'mock-token-fallback') {
              import('../services/apiClient').then(({ default: apiRequest }) => {
                apiRequest('/tracker/add', {
                  method: 'POST',
                  token,
                  body: {
                    activityType: activity.name,
                    category: activity.category,
                    quantity: parseFloat(activity.quantity) || 1,
                    duration: parseFloat(activity.duration) || 0,
                  }
                }).then(backendData => {
                  if (backendData && backendData.scoreUpdate) {
                    const currentUser = useAuthStore.getState().user;
                    if (currentUser) {
                      useAuthStore.setState({
                        user: {
                          ...currentUser,
                          xp: backendData.scoreUpdate.newTotalXp,
                          level: backendData.scoreUpdate.newLevel,
                          streak: backendData.scoreUpdate.newStreak,
                        }
                      });
                    }
                    set({
                      totalXP: backendData.scoreUpdate.newTotalXp,
                      streak: backendData.scoreUpdate.newStreak,
                    });
                  }
                }).catch(err => {
                  console.error('Failed to sync activity to backend:', err);
                });
              });
            }
          });
        } catch (err) {
          console.error('Error during background sync setup:', err);
        }

        return { xpEarned, coinsEarned, activity: newActivity, leveledUp: nextLevel > currentLevel };
      },

      refreshDailyQuests: () => {
        const today = new Date().toDateString();
        set({ quests: pickDailyQuests(today), questDate: today });
      },

      completeQuest: (id) => {
        set((state) => {
          const quest = state.quests.find(q => q.id === id);
          if (!quest || quest.completed || quest.progress < quest.target) return state;
          
          const newTotalXP = state.totalXP + quest.rewardXP;

          // Level up tree planting logic
          const currentLevel = getLevel(state.totalXP).level;
          const nextLevel = getLevel(newTotalXP).level;
          let newPlantedTrees = state.plantedTrees;
          let newForestLevel = state.forestLevel;

          if (nextLevel > currentLevel) {
            newPlantedTrees += 1;
            newForestLevel = Math.min(10, Math.floor(newPlantedTrees / 3) + 1);
            toast.success(`🎉 LEVEL UP! You reached Level ${nextLevel}! A new tree has been planted in your Virtual Forest! 🌳`, { autoClose: 6000 });
          }

          return {
            quests: state.quests.map(q => q.id === id ? { ...q, completed: true } : q),
            totalXP: newTotalXP,
            coins: state.coins + quest.rewardCoins,
            plantedTrees: newPlantedTrees,
            forestLevel: newForestLevel,
          };
        });
      },

      spendCoins: (amount) => {
        const { coins } = get();
        if (coins >= amount) {
          set({ coins: coins - amount });
          return true;
        }
        return false;
      },

      readNewsArticle: (id) => {
        const state = get();
        const today = new Date().toDateString();
        
        let currentCount = state.newsReadDate === today ? state.newsReadTodayCount : 0;

        if (state.readArticles.includes(id)) {
          return { success: false, message: 'already_read' };
        }

        if (currentCount >= 3) {
          return { success: false, message: 'limit_reached' };
        }

        const newTotalXP = state.totalXP + 10;

        // Level up tree planting logic
        const currentLevel = getLevel(state.totalXP).level;
        const nextLevel = getLevel(newTotalXP).level;
        let newPlantedTrees = state.plantedTrees;
        let newForestLevel = state.forestLevel;

        if (nextLevel > currentLevel) {
          newPlantedTrees += 1;
          newForestLevel = Math.min(10, Math.floor(newPlantedTrees / 3) + 1);
          toast.success(`🎉 LEVEL UP! You reached Level ${nextLevel}! A new tree has been planted in your Virtual Forest! 🌳`, { autoClose: 6000 });
        }

        set({
          readArticles: [...state.readArticles, id],
          newsReadTodayCount: currentCount + 1,
          newsReadDate: today,
          totalXP: newTotalXP,
          coins: state.coins + 3,
          plantedTrees: newPlantedTrees,
          forestLevel: newForestLevel,
        });
        
        return { success: true, message: 'rewarded', leveledUp: nextLevel > currentLevel };
      },

      plantTree: () => {
        const { coins, plantedTrees, forestLevel } = get();
        const treeCost = forestLevel * 50; // Dynamic gamification cost

        if (coins >= treeCost) {
          set({
            coins: coins - treeCost,
            plantedTrees: plantedTrees + 1,
            forestLevel: Math.min(10, Math.floor((plantedTrees + 1) / 3) + 1),
          });
          return true;
        }
        return false;
      },

      editActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map(a =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter(a => a.id !== id),
        }));
      },

      getTodayActivities: () => {
        const today = new Date().toDateString();
        return get().activities.filter(
          a => new Date(a.timestamp).toDateString() === today
        );
      },

      getWeeklyData: () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toDateString();
          const dayActivities = get().activities.filter(
            a => new Date(a.timestamp).toDateString() === dateStr
          );
          const total = dayActivities.reduce((sum, a) => sum + a.carbonKg, 0);
          days.push({
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            carbon: parseFloat(total.toFixed(2)),
            score: calcDailyScore(total),
          });
        }
        return days;
      },

      getCategoryBreakdown: () => {
        const today = new Date().toDateString();
        const todayActivities = get().activities.filter(
          a => new Date(a.timestamp).toDateString() === today
        );
        const breakdown = {};
        todayActivities.forEach(a => {
          if (!breakdown[a.category]) breakdown[a.category] = 0;
          breakdown[a.category] += a.carbonKg;
        });
        return Object.entries(breakdown).map(([cat, kg]) => ({
          name: CATEGORIES[cat]?.label || cat,
          value: parseFloat(kg.toFixed(3)),
          color: CATEGORIES[cat]?.color || '#6B7280',
        }));
      },
    }),
    {
      name: 'ecoquest-tracker',
    }
  )
);

export default useTrackerStore;
