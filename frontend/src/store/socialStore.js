import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── 100 Indian districts ── */
const INDIAN_DISTRICTS = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow',
  'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Meerut',
  'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore',
  'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
  'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur',
  'Hubballi', 'Tiruchirappalli', 'Bareilly', 'Moradabad', 'Mysuru',
];

/* ── 100 unique Indian names ── */
const INDIAN_NAMES = [
  'Aarav Sharma',    'Priya Singh',     'Rohan Gupta',    'Ananya Patel',
  'Vikram Rao',      'Kavya Nair',      'Arjun Verma',    'Deepika Reddy',
  'Siddharth Joshi', 'Sneha Iyer',      'Karan Mehta',    'Pooja Agarwal',
  'Rahul Bansal',    'Riya Choudhury',  'Aditya Kumar',   'Neha Bajaj',
  'Manish Saxena',   'Simran Kaur',     'Akash Malhotra', 'Divya Pandey',
  'Nikhil Tiwari',   'Shreya Bhatt',    'Vivek Mishra',   'Meera Pillai',
  'Gaurav Yadav',    'Ishaan Bose',     'Tanvi Desai',    'Prakash Hegde',
  'Sonali Thakur',   'Amitabh Dubey',   'Naina Srivastava','Suresh Patil',
  'Kritika Jain',    'Harshit Tripathi','Bhavna Chauhan', 'Mohit Arora',
  'Swathi Menon',    'Dev Krishnamurti','Ankita Shukla',  'Rajesh Bhagat',
  'Pallavi Dutta',   'Yash Chandra',    'Rekha Oberoi',   'Abhinav Bhatia',
  'Chhavi Aggarwal', 'Rohit Sawant',    'Jyoti Lal',      'Sachin Biswas',
  'Preeti Ghosh',    'Alok Chatterjee', 'Ritika Bahl',    'Sameer Kapoor',
  'Tanya Rastogi',   'Vinay Shekhawat', 'Usha Murthy',    'Parth Mehrotra',
  'Nandita Roy',     'Sumit Khanna',    'Lalita Rao',     'Chirag Desai',
  'Sweta Pandey',    'Kundan Misra',    'Heena Sheikh',   'Abhishek Datta',
  'Kavita Rawat',    'Tarun Bakshi',    'Monika Sethi',   'Fahad Ansari',
  'Anushka Tiwari',  'Girish Negi',     'Sonia Bhardwaj', 'Vivek Sagar',
  'Mamta Tripathi',  'Rajan Oberoi',    'Sheetal Verma',  'Devansh Arora',
  'Ira Kulkarni',    'Omkar Joshi',     'Varsha Pillai',  'Lalit Goswami',
  'Priyanka Das',    'Kunal Meena',     'Savita Nair',    'Dhananjay Pal',
  'Aishwarya Sen',   'Tejas Patil',     'Falguni Shah',   'Hardik Patel',
  'Madhuri Shinde',  'Saurabh Gupta',   'Anjali Mishra',  'Pranav Kulkarni',
  'Geeta Reddy',     'Satish Kumar',    'Manju Singh',    'Ravi Shankar',
  'Poornima Hegde',  'Arun Sharma',     'Leela Krishnan', 'Sunil Mehta',
];

/* ── Seeded random for stable data across re-renders ── */
function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getState(district) {
  const map = {
    'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Nagpur': 'Maharashtra',
    'Nashik': 'Maharashtra', 'Thane': 'Maharashtra', 'Aurangabad': 'Maharashtra',
    'Pimpri-Chinchwad': 'Maharashtra', 'Solapur': 'Maharashtra',
    'Delhi': 'Delhi', 'Ghaziabad': 'Uttar Pradesh',
    'Bengaluru': 'Karnataka', 'Mysuru': 'Karnataka', 'Hubballi': 'Karnataka',
    'Hyderabad': 'Telangana', 'Visakhapatnam': 'Andhra Pradesh', 'Vijayawada': 'Andhra Pradesh',
    'Ahmedabad': 'Gujarat', 'Surat': 'Gujarat', 'Rajkot': 'Gujarat', 'Vadodara': 'Gujarat',
    'Chennai': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu', 'Madurai': 'Tamil Nadu', 'Tiruchirappalli': 'Tamil Nadu',
    'Kolkata': 'West Bengal', 'Howrah': 'West Bengal',
    'Jaipur': 'Rajasthan', 'Jodhpur': 'Rajasthan', 'Kota': 'Rajasthan',
    'Lucknow': 'Uttar Pradesh', 'Kanpur': 'Uttar Pradesh', 'Agra': 'Uttar Pradesh',
    'Meerut': 'Uttar Pradesh', 'Varanasi': 'Uttar Pradesh', 'Allahabad': 'Uttar Pradesh',
    'Bareilly': 'Uttar Pradesh', 'Moradabad': 'Uttar Pradesh',
    'Bhopal': 'Madhya Pradesh', 'Indore': 'Madhya Pradesh', 'Jabalpur': 'Madhya Pradesh', 'Gwalior': 'Madhya Pradesh',
    'Patna': 'Bihar', 'Ranchi': 'Jharkhand', 'Dhanbad': 'Jharkhand',
    'Chandigarh': 'Punjab', 'Ludhiana': 'Punjab', 'Amritsar': 'Punjab',
    'Raipur': 'Chhattisgarh', 'Guwahati': 'Assam', 'Srinagar': 'J&K',
  };
  return map[district] || 'India';
}

function generateUser(index) {
  const name = INDIAN_NAMES[index % INDIAN_NAMES.length];
  const district = INDIAN_DISTRICTS[index % INDIAN_DISTRICTS.length];
  const state = getState(district);
  // Vary XP range for dummy rankers between 500 and 1000
  const xp = Math.floor(seededRandom(index * 7 + 13) * 500) + 500;
  const carbonSaved = parseFloat((xp * 0.012).toFixed(1));
  const level = Math.floor(xp / 500) + 1;
  const avatarSeed = `${name.replace(' ', '')}${index}`;
  return {
    id: `u${index}`,
    name,
    district,
    state,
    totalXP: xp,
    carbonSaved,
    level,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
    joinDate: new Date(Date.now() - seededRandom(index * 3) * 1e10).toISOString(),
  };
}

/* ── Generate 100 stable users, sorted by XP desc ── */
const ALL_USERS = Array.from({ length: 100 }, (_, i) => generateUser(i))
  .sort((a, b) => b.totalXP - a.totalXP);

// Assign permanent rank
ALL_USERS.forEach((u, i) => { u.rank = i + 1; });

const MOCK_CHALLENGES = [
  { id: 'c1', title: 'Community Green Week',    goal: 'Reduce 50,000 kg CO₂ collectively',         progress: 34500, target: 50000, participants: 1240, daysLeft: 3  },
  { id: 'c2', title: 'Plant 1000 Trees',         goal: 'Use coins to plant trees',                  progress: 450,   target: 1000,  participants: 850,  daysLeft: 12 },
  { id: 'c3', title: 'Zero Plastic July',        goal: 'Avoid single-use plastic for 30 days',      progress: 280,   target: 500,   participants: 620,  daysLeft: 18 },
  { id: 'c4', title: 'Cycle to Work Challenge',  goal: 'Log 10,000 km of cycling combined',         progress: 6400,  target: 10000, participants: 370,  daysLeft: 7  },
];

const useSocialStore = create(
  persist(
    (set) => ({
      challenges: MOCK_CHALLENGES,
      allUsers: ALL_USERS,

      /**
       * scope: 'District' → top 50 users
       *        'State'    → top 50 users
       *        'Country'  → top 100 users
       */
      getLeaderboard: (scope, userXP, userName, userAvatar, userDistrict) => {
        let pool;

        if (scope === 'District') {
          pool = ALL_USERS.slice(0, 50);           // Top 50 for district
        } else if (scope === 'State') {
          pool = ALL_USERS.slice(0, 50);           // Top 50 for state
        } else {
          pool = [...ALL_USERS];                   // All 100 for India
        }

        // Inject logged-in user (replace if already exists)
        pool = pool.filter(u => u.id !== 'me');
        const meUser = {
          id: 'me',
          name: userName || 'You',
          totalXP: userXP,
          carbonSaved: parseFloat((userXP * 0.012).toFixed(1)),
          level: Math.floor(userXP / 500) + 1,
          district: userDistrict || 'Your City',
          state: 'India',
          isMe: true,
          avatar: userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=You`,
        };

        pool.push(meUser);
        pool.sort((a, b) => b.totalXP - a.totalXP);

        // Find true rank of the user. Initial rank is 0 if user has no additional XP (<= 0)
        let myRank = pool.findIndex(u => u.id === 'me') + 1;
        if (userXP <= 0) {
          myRank = 0;
        }
        meUser.rank = myRank;

        // Cap: 50 for District/State, 100 for Country
        const cap = scope === 'Country' ? 100 : 50;
        let finalPool = pool.slice(0, cap);

        // If user got sliced off, replace the last item with the user so they are always visible
        if (!finalPool.some(u => u.id === 'me')) {
          finalPool[finalPool.length - 1] = meUser;
        }

        // Assign display ranks for others, preserve user's true rank
        finalPool.forEach((p, i) => {
          if (p.id !== 'me') {
            p.rank = i + 1;
          }
        });

        return finalPool;
      },

      contributeToChallenge: (id, amount) => {
        set(state => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, progress: Math.min(c.target, c.progress + amount) } : c
          )
        }));
      }
    }),
    { name: 'ecoquest-social-v2' }   // bumped version to clear old cache
  )
);

export default useSocialStore;
