import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { Users, Trophy, Percent, TrendingUp, BarChart2 } from 'lucide-react';

interface RadarData {
  subject: string;
  value: number;
}

interface RankData {
  year: number;
  rank: number;
}

interface TeamData {
  name: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  titles: number;
  win_pct: number;
  total_matches: number;
  playoffs_count: number;
  finals_count: number;
  future_chances: Record<string, number>;
  historical_ranks: RankData[];
  strength_radar: RadarData[];
}

interface TeamAnalysisViewProps {
  teams: TeamData[];
}

const TEAM_META: Record<string, { desc: string }> = {
  'Chennai Super Kings': { desc: 'Known for tactical consistency and squad stability. A heavy emphasis on home venue advantages at Chepauk.' },
  'Mumbai Indians': { desc: 'A power-packed squad historically built on strong scouting networks, elite pacers, and multi-title experience.' },
  'Royal Challengers Bengaluru': { desc: 'Celebrated for explosive batting top orders, high-altitude boundary hitting, and a passionate fan base.' },
  'Kolkata Knight Riders': { desc: 'Tactically versatile squad, emphasizing premium spinners and match-winning spin-friendly strategies at Eden Gardens.' },
  'Rajasthan Royals': { desc: 'Built on analytical scouting, young domestic talent development, and strong defensive bowling operations.' },
  'Delhi Capitals': { desc: 'A squad characterized by heavy hitting and a blend of explosive Indian batters with international pace.' },
  'Punjab Kings': { desc: 'Possesses strong individual performers but historically hampered by high squad rotation rates and leadership shifts.' },
  'Sunrisers Hyderabad': { desc: 'Built on a legacy of stingy bowling defenses and high-efficiency overseas opening partnerships.' },
  'Lucknow Super Giants': { desc: 'A highly balanced expansion franchise utilizing heavy all-rounder depth and multi-utility lineups.' },
  'Gujarat Titans': { desc: 'A champion expansion squad focusing on calm finishes, chase efficiency, and high team synergy.' }
};

export const TeamAnalysisView: React.FC<TeamAnalysisViewProps> = ({ teams }) => {
  const [selectedTeamName, setSelectedTeamName] = useState<string>(teams[0]?.name || '');
  const team = teams.find(t => t.name === selectedTeamName);

  if (!team) return <div className="text-white text-center py-10 font-medium">No team data available.</div>;

  // Chart data formatting
  const futureChancesData = Object.entries(team.future_chances).map(([year, val]) => ({
    year,
    probability: parseFloat((val * 100).toFixed(1))
  }));

  const description = TEAM_META[team.name]?.desc || "Franchise statistical overview and dynasty prediction curves.";

  return (
    <div className="space-y-8 py-6">
      {/* Selector dropdown and header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Team Intelligence</h2>
            <p className="text-sm text-slate-400">Deep-dive stats and model predictions per franchise</p>
          </div>
        </div>

        {/* Dropdown */}
        <div className="w-full md:w-72">
          <select
            value={selectedTeamName}
            onChange={(e) => setSelectedTeamName(e.target.value)}
            className="w-full p-4 glass-input font-semibold text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm"
          >
            {teams.map(t => (
              <option key={t.name} value={t.name} className="bg-slate-950 text-white font-medium">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Stats and Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Team Card Summary */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg border border-white/10 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${team.primary_color}, ${team.secondary_color})` }}
              >
                {team.abbreviation}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{team.name}</h3>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">IPL Franchise</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              {description}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Championships
              </span>
              <span className="text-sm font-bold text-white">{team.titles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-400" /> Win Rate
              </span>
              <span className="text-sm font-bold text-white">{(team.win_pct * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> Playoff Finishes
              </span>
              <span className="text-sm font-bold text-white">{team.playoffs_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> Total Matches
              </span>
              <span className="text-sm font-bold text-white">{team.total_matches}</span>
            </div>
          </div>
        </div>

        {/* Strength Radar Chart */}
        <div className="glass-panel p-6 flex flex-col items-center justify-between lg:col-span-2 min-h-[350px]">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest self-start mb-4">SQUAD CAPABILITY METRICS</h4>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={team.strength_radar}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} fontWeight={600} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="rgba(255, 255, 255, 0.15)" fontSize={9} />
                <Radar
                  name={team.abbreviation}
                  dataKey="value"
                  stroke={team.primary_color}
                  fill={team.primary_color}
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Future Prediction Chances Area Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between lg:col-span-1 min-h-[350px]">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">DYNASTY PROBABILITY (2027-2031)</h4>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={futureChancesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id={`colorProb-${team.abbreviation}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={team.primary_color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={team.primary_color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#475569" fontSize={10} fontWeight={600} />
                <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  stroke={team.primary_color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#colorProb-${team.abbreviation})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
            Win probability trajectory calculated using dynamic Monte Carlo state-updating.
          </p>
        </div>
      </div>

      {/* Historical Trend Line Chart */}
      <div className="glass-panel p-6 space-y-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Historical Performance Trend (League Rank)</h4>
        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={team.historical_ranks} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
              <XAxis dataKey="year" stroke="#475569" fontSize={10} fontWeight={600} />
              <YAxis stroke="#475569" fontSize={10} reversed domain={[1, 10]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                formatter={(value) => [`Rank ${value}`, 'Position']}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke={team.primary_color}
                strokeWidth={2.5}
                activeDot={{ r: 6 }}
                dot={{ strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-500 text-center">
          *Lower rank values indicate better positions (1st rank represents top of the league).
        </p>
      </div>
    </div>
  );
};
