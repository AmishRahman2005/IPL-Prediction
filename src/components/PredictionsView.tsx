import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

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

interface PredictionsViewProps {
  predictions: SeasonPrediction[];
}

const TEAM_COLORS: Record<string, { bg: string; text: string; logoBg: string; border: string }> = {
  'Chennai Super Kings': { bg: 'from-amber-500/10 to-yellow-500/5', text: 'text-yellow-400', logoBg: 'from-yellow-400 to-amber-500', border: 'border-yellow-500/20' },
  'Mumbai Indians': { bg: 'from-blue-500/10 to-indigo-500/5', text: 'text-blue-400', logoBg: 'from-blue-500 to-indigo-600', border: 'border-blue-500/20' },
  'Royal Challengers Bengaluru': { bg: 'from-red-500/10 to-rose-500/5', text: 'text-red-400', logoBg: 'from-red-500 to-rose-600', border: 'border-red-500/20' },
  'Kolkata Knight Riders': { bg: 'from-purple-500/10 to-fuchsia-500/5', text: 'text-purple-400', logoBg: 'from-purple-500 to-fuchsia-600', border: 'border-purple-500/20' },
  'Rajasthan Royals': { bg: 'from-pink-500/10 to-rose-500/5', text: 'text-pink-400', logoBg: 'from-pink-500 to-rose-400', border: 'border-pink-500/20' },
  'Delhi Capitals': { bg: 'from-blue-600/10 to-sky-500/5', text: 'text-sky-400', logoBg: 'from-blue-700 to-sky-500', border: 'border-sky-500/20' },
  'Punjab Kings': { bg: 'from-red-600/10 to-orange-500/5', text: 'text-red-500', logoBg: 'from-red-500 to-orange-500', border: 'border-red-500/20' },
  'Sunrisers Hyderabad': { bg: 'from-orange-500/10 to-amber-600/5', text: 'text-orange-400', logoBg: 'from-orange-500 to-amber-600', border: 'border-orange-500/20' },
  'Lucknow Super Giants': { bg: 'from-cyan-500/10 to-sky-500/5', text: 'text-cyan-400', logoBg: 'from-cyan-500 to-sky-400', border: 'border-cyan-500/20' },
  'Gujarat Titans': { bg: 'from-slate-700/10 to-indigo-950/5', text: 'text-indigo-300', logoBg: 'from-slate-800 to-indigo-950', border: 'border-indigo-500/20' }
};

const getAbbr = (team: string) => {
  const mapping: Record<string, string> = {
    'Chennai Super Kings': 'CSK', 'Mumbai Indians': 'MI', 'Royal Challengers Bengaluru': 'RCB',
    'Kolkata Knight Riders': 'KKR', 'Rajasthan Royals': 'RR', 'Delhi Capitals': 'DC',
    'Punjab Kings': 'PBKS', 'Sunrisers Hyderabad': 'SRH', 'Lucknow Super Giants': 'LSG',
    'Gujarat Titans': 'GT'
  };
  return mapping[team] || team.slice(0, 3).toUpperCase();
};

export const PredictionsView: React.FC<PredictionsViewProps> = ({ predictions }) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const toggleExpand = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-indigo-400" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">5-Year Dynasty Outlook</h2>
          <p className="text-sm text-slate-400">Monte Carlo predictions for seasons 2027 to 2031</p>
        </div>
      </div>

      <div className="space-y-6">
        {predictions.map((pred, index) => {
          const colors = TEAM_COLORS[pred.champion] || {
            bg: 'from-indigo-500/10 to-cyan-500/5',
            text: 'text-indigo-400',
            logoBg: 'from-indigo-500 to-cyan-500',
            border: 'border-indigo-500/20'
          };
          const isExpanded = expandedYear === pred.year;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={pred.year}
              className={`glass-panel p-6 border-l-4 ${colors.border} transition-all duration-300`}
            >
              {/* Card Header Summary */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Year and Champion Name */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="px-4 py-3 rounded-xl bg-slate-900 border border-white/5 text-center flex-shrink-0">
                    <span className="text-2xl font-black text-white">{pred.year}</span>
                    <span className="block text-[9px] font-semibold tracking-wider text-indigo-400 uppercase">SEASON</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PROJECTED CHAMPION</div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${colors.logoBg} flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-md`}>
                        {getAbbr(pred.champion)}
                      </div>
                      <h3 className="text-xl font-bold text-white leading-tight">{pred.champion}</h3>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators & Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto flex-1 md:flex-initial">
                  <div className="space-y-1 text-center md:text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Win Probability</div>
                    <div className="text-lg font-extrabold text-white">{(pred.champion_probability * 100).toFixed(1)}%</div>
                  </div>

                  <div className="space-y-1 text-center md:text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Confidence Meter</div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className="w-16 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${pred.confidence_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-indigo-400">{pred.confidence_score.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1 space-y-1 text-center md:text-left">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Top 4 Qualifiers</div>
                    <div className="flex gap-1 justify-center md:justify-start">
                      {pred.top_4.map((team) => {
                        return (
                          <span
                            title={team}
                            key={team}
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${TEAM_COLORS[team]?.logoBg || 'from-slate-500 to-slate-700'} flex items-center justify-center text-[9px] font-black text-white border border-white/15 cursor-help shadow-sm`}
                          >
                            {getAbbr(team)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action button to expand expected points table */}
                <button
                  onClick={() => toggleExpand(pred.year)}
                  className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all w-full md:w-auto flex items-center justify-center gap-2 border border-white/5 font-semibold text-xs"
                >
                  {isExpanded ? (
                    <>
                      Hide Standings
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Expected Standings
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Standings / Points Table */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        Expected League Standings
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                              <th className="py-2.5">Pos</th>
                              <th className="py-2.5">Team</th>
                              <th className="py-2.5 text-center">Exp Wins</th>
                              <th className="py-2.5 text-center">Exp Points</th>
                              <th className="py-2.5 text-center">Playoff Prob</th>
                              <th className="py-2.5 text-right">Championship Odds</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {pred.teams_probs.map((t, idx) => {
                              return (
                                <tr key={t.team} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="py-3 font-semibold text-slate-400 w-8">{idx + 1}</td>
                                  <td className="py-3 font-medium text-white flex items-center gap-2.5">
                                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${TEAM_COLORS[t.team]?.logoBg || 'from-indigo-500 to-cyan-500'}`} />
                                    {t.team}
                                  </td>
                                  <td className="py-3 text-center text-slate-300">{t.expected_wins.toFixed(1)}</td>
                                  <td className="py-3 text-center font-bold text-white">{t.expected_points.toFixed(1)}</td>
                                  <td className="py-3 text-center">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${t.playoff_probability > 0.7 ? 'bg-emerald-500/10 text-emerald-400' : t.playoff_probability > 0.4 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                      {(t.playoff_probability * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 text-right font-extrabold text-white">
                                    {(t.win_probability * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
