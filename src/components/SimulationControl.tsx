import React, { useState } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';

interface Weights {
  strength_multiplier: number;
  recent_form_weight: number;
  squad_stability_weight: number;
  home_advantage_weight: number;
}

interface SimulationControlProps {
  weights: Weights;
  isSimulating: boolean;
  onRunSimulation: (newWeights: Weights) => void;
}

export const SimulationControl: React.FC<SimulationControlProps> = ({
  weights: initialWeights,
  isSimulating,
  onRunSimulation
}) => {
  const [weights, setWeights] = useState<Weights>({ ...initialWeights });

  const handleSliderChange = (key: keyof Weights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation(weights);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Weights Panel */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Simulation Weights</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Strength Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Team Strength Multiplier</span>
              <span className="text-indigo-400 font-bold">{weights.strength_multiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={weights.strength_multiplier}
              onChange={(e) => handleSliderChange('strength_multiplier', parseFloat(e.target.value))}
              disabled={isSimulating}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Scales the effect of historical capabilities (batting, bowling, win percentages).
            </p>
          </div>

          {/* Recent Form Weight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Recent Form Weight</span>
              <span className="text-indigo-400 font-bold">{weights.recent_form_weight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={weights.recent_form_weight}
              onChange={(e) => handleSliderChange('recent_form_weight', parseFloat(e.target.value))}
              disabled={isSimulating}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Scales season-to-season momentum effects and moving average finish positions.
            </p>
          </div>

          {/* Squad Stability Weight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Squad Stability Weight</span>
              <span className="text-indigo-400 font-bold">{weights.squad_stability_weight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={weights.squad_stability_weight}
              onChange={(e) => handleSliderChange('squad_stability_weight', parseFloat(e.target.value))}
              disabled={isSimulating}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Scales squad retention rating, captaincy scores, and team consistency.
            </p>
          </div>

          {/* Home Advantage Weight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Home Advantage Weight</span>
              <span className="text-indigo-400 font-bold">{weights.home_advantage_weight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={weights.home_advantage_weight}
              onChange={(e) => handleSliderChange('home_advantage_weight', parseFloat(e.target.value))}
              disabled={isSimulating}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Scales home-stadium win probabilities (e.g. CSK at Chepauk, MI at Wankhede).
            </p>
          </div>

          <button
            type="submit"
            disabled={isSimulating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating 10,000+ Seasons...' : 'Run New Simulation'}
          </button>
        </form>
      </div>

      {/* Simulation Presets Panel */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white font-sans">Scenario Presets</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Select a statistical scenario to instantly configure weights for the simulator.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => {
              setWeights({
                strength_multiplier: 1.0,
                recent_form_weight: 1.0,
                squad_stability_weight: 1.0,
                home_advantage_weight: 1.0
              });
            }}
            className="p-3 text-left rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all text-xs font-semibold text-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Preset</span>
            Default Baseline
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => {
              setWeights({
                strength_multiplier: 1.2,
                recent_form_weight: 0.8,
                squad_stability_weight: 1.0,
                home_advantage_weight: 2.2
              });
            }}
            className="p-3 text-left rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition-all text-xs font-semibold text-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <span className="block text-[9px] text-cyan-500 font-bold uppercase tracking-wider mb-0.5">Fortress</span>
            Home Advantage
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => {
              setWeights({
                strength_multiplier: 0.9,
                recent_form_weight: 2.5,
                squad_stability_weight: 0.8,
                home_advantage_weight: 1.0
              });
            }}
            className="p-3 text-left rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-purple-500/30 transition-all text-xs font-semibold text-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <span className="block text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">Streak</span>
            Momentum Surge
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => {
              setWeights({
                strength_multiplier: 1.5,
                recent_form_weight: 1.0,
                squad_stability_weight: 2.0,
                home_advantage_weight: 0.8
              });
            }}
            className="p-3 text-left rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-amber-500/30 transition-all text-xs font-semibold text-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <span className="block text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-0.5">Dynasty</span>
            Squad Continuity
          </button>
        </div>
      </div>
    </div>
  );
};
