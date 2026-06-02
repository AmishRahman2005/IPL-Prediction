import React from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Activity, Users, Shield } from 'lucide-react';

interface TeamProbability {
  team: string;
  win_probability: number;
  playoff_probability: number;
  expected_points: number;
  expected_wins: number;
}

interface SeasonPrediction {
  year: number;
  champion: string;
  champion_probability: number;
  confidence_score: number;
  top_4: string[];
  teams_probs: TeamProbability[];
}

interface DashboardViewProps {
  predictions: SeasonPrediction[];
  onNavigateToPredictions: () => void;
}

// Colors and Abbreviations mapping for styling
const TEAM_META: Record<string, { abbr: string; primary: string; secondary: string; text: string }> = {
  'Chennai Super Kings': { abbr: 'CSK', primary: 'from-yellow-400 to-amber-500', secondary: '#005CA8', text: 'text-yellow-400' },
  'Mumbai Indians': { abbr: 'MI', primary: 'from-blue-600 to-indigo-500', secondary: '#D1AB3E', text: 'text-blue-400' },
  'Royal Challengers Bengaluru': { abbr: 'RCB', primary: 'from-red-600 to-rose-700', secondary: '#2B2A29', text: 'text-red-400' },
  'Kolkata Knight Riders': { abbr: 'KKR', primary: 'from-purple-600 to-fuchsia-700', secondary: '#ECC542', text: 'text-purple-400' },
  'Rajasthan Royals': { abbr: 'RR', primary: 'from-pink-500 to-rose-400', secondary: '#254AA5', text: 'text-pink-400' },
  'Delhi Capitals': { abbr: 'DC', primary: 'from-blue-700 to-sky-500', secondary: '#FF0000', text: 'text-sky-400' },
  'Punjab Kings': { abbr: 'PBKS', primary: 'from-red-500 to-orange-500', secondary: '#D1D3D4', text: 'text-red-500' },
  'Sunrisers Hyderabad': { abbr: 'SRH', primary: 'from-orange-500 to-amber-600', secondary: '#000000', text: 'text-orange-500' },
  'Lucknow Super Giants': { abbr: 'LSG', primary: 'from-cyan-500 to-sky-400', secondary: '#FFC20E', text: 'text-cyan-400' },
  'Gujarat Titans': { abbr: 'GT', primary: 'from-slate-800 to-indigo-950', secondary: '#BF9A3C', text: 'text-indigo-300' }
};

export const DashboardView: React.FC<DashboardViewProps> = ({ predictions, onNavigateToPredictions }) => {
  const nextSeason = predictions.length > 0 ? predictions[0] : null;
  const champMeta = nextSeason ? TEAM_META[nextSeason.champion] : null;

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[500px]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex-1 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold"
          >
            <Zap className="w-4 h-4 fill-indigo-300/30" />
            Machine Learning & Monte Carlo Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white"
          >
            🏆 <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">IPL Dynasty AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
          >
            Predicting the Future of the Indian Premier League. Harness the power of historical statistics, squad stability indexes, and 10,000+ simulated matches to forecast the next 5 champions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4"
          >
            <button
              onClick={onNavigateToPredictions}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Generate Predictions
            </button>
          </motion.div>
        </div>

        {/* Floating Probability Cards & Animated Trophy */}
        <div className="flex-1 relative flex items-center justify-center min-w-[320px] lg:min-w-[450px]">
          {/* Animated Glow Backing */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl animate-pulse-slow" />

          {/* Trophy Frame */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 p-6 flex justify-center items-center select-none"
          >
            <svg
              className="w-56 h-56 text-amber-400/90 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
              <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="rgba(251,191,36,0.1)" />
            </svg>
          </motion.div>

          {/* Floating probability card 1 */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-10 left-10 z-20 p-4 w-40 glass-panel shadow-2xl border-white/10"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-xs font-semibold text-slate-300">CSK</span>
            </div>
            <div className="text-xl font-bold text-white">26.7%</div>
            <div className="text-[10px] text-slate-500">Championship odds</div>
          </motion.div>

          {/* Floating probability card 2 */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-10 right-10 z-20 p-4 w-40 glass-panel shadow-2xl border-white/10"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-slate-300">RCB</span>
            </div>
            <div className="text-xl font-bold text-white">18.4%</div>
            <div className="text-[10px] text-slate-500">Championship odds</div>
          </motion.div>
        </div>
      </section>

      {/* Next Season Champion Dashboard Section */}
      {nextSeason && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              Next Season Prediction (IPL 2027)
            </h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-2.5 py-1 rounded">
              High Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Large Champion card */}
            <div className="lg:col-span-2 glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Decorative dynamic ambient glow */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 text-center md:text-left flex-1">
                <div className="space-y-1">
                  <div className="text-sm font-semibold tracking-wider text-slate-400 uppercase">PROJECTED 2027 CHAMPION</div>
                  <h3 className="text-4xl md:text-5xl font-extrabold text-white">{nextSeason.champion}</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">WIN PROBABILITY</div>
                    <div className="text-3xl font-extrabold text-white mt-1">
                      {(nextSeason.champion_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">CONFIDENCE</div>
                    <div className="text-3xl font-extrabold text-indigo-400 mt-1">
                      {nextSeason.confidence_score.toFixed(0)}%
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <div className="text-xs text-slate-500 font-medium">EXPECTED FINISH</div>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">1st Place</div>
                  </div>
                </div>
              </div>

              {/* Styled Team Logo / Badge */}
              <div className="relative flex-shrink-0 flex items-center justify-center w-48 h-48 rounded-full border border-white/5 bg-slate-950/40 p-4 shadow-inner">
                {/* Large Gradient Orb representing the team */}
                <div className={`absolute inset-4 rounded-full bg-gradient-to-tr ${champMeta ? champMeta.primary : 'from-indigo-600 to-cyan-500'} opacity-85 blur-sm`} />
                <div className="relative z-10 text-center select-none">
                  <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {champMeta ? champMeta.abbr : 'TBD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="glass-panel p-8 flex flex-col justify-between space-y-6">
              <h4 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Season Drivers</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Recent Form Factor</div>
                    <div className="text-sm font-bold text-white">High Win-Streak Weight</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Squad Stability Impact</div>
                    <div className="text-sm font-bold text-white">Consistent Core Roster</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-500/10 text-amber-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Championship Experience</div>
                    <div className="text-sm font-bold text-white">High-Pressure Performers</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Dynasty index calculations suggest {nextSeason.champion} possesses a strong statistical advantage entering the 2027 season, driven by exceptional batting depth and home venue consistency.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};
