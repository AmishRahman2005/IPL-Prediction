import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, LayoutDashboard, Calendar, BarChart2, Zap } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { PredictionsView } from './components/PredictionsView';
import { TeamAnalysisView } from './components/TeamAnalysisView';
import { AnalyticsView } from './components/AnalyticsView';
import { SimulationControl } from './components/SimulationControl';

const API_BASE = 'http://localhost:8000';

interface Weights {
  strength_multiplier: number;
  recent_form_weight: number;
  squad_stability_weight: number;
  home_advantage_weight: number;
}

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

interface ModelMetric {
  model: string;
  accuracy: number;
  auc: number;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface Driver {
  factor: string;
  score: number;
  description: string;
}

interface AnalyticsData {
  best_model: string;
  accuracy: number;
  model_comparison: ModelMetric[];
  feature_importance: FeatureImportance[];
  confusion_matrix: number[][];
  drivers: Driver[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'teams' | 'analytics'>('dashboard');
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking server status...');
  const [isSimulating, setIsSimulating] = useState(false);
  const [weights, setWeights] = useState<Weights>({
    strength_multiplier: 1.0,
    recent_form_weight: 1.0,
    squad_stability_weight: 1.0,
    home_advantage_weight: 1.0
  });

  const [predictions, setPredictions] = useState<SeasonPrediction[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Poll status endpoint
  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      setIsReady(data.is_ready);
      setStatusMessage(data.status_message);
      if (data.current_weights) {
        setWeights(data.current_weights);
      }
      return data.is_ready;
    } catch {
      setIsReady(false);
      setStatusMessage('Server offline. Verify backend is running.');
      return false;
    }
  };

  // Fetch all endpoints
  const fetchAllData = async () => {
    try {
      const [predRes, teamsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/api/predictions`),
        fetch(`${API_BASE}/api/teams`),
        fetch(`${API_BASE}/api/analytics`)
      ]);

      if (predRes.ok && teamsRes.ok && analyticsRes.ok) {
        const predData = await predRes.json() as SeasonPrediction[];
        const teamsData = await teamsRes.json() as TeamData[];
        const analyticsData = await analyticsRes.json() as AnalyticsData;

        setPredictions(predData);
        setTeams(teamsData);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // Initial hook
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const initPoll = async () => {
      const ready = await checkStatus();
      if (ready) {
        await fetchAllData();
      } else {
        // Poll every 2 seconds until ready
        intervalId = setInterval(async () => {
          const isOk = await checkStatus();
          if (isOk) {
            clearInterval(intervalId);
            await fetchAllData();
          }
        }, 2000);
      }
    };

    initPoll();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Poll when retraining is triggered
  const startSimulationPolling = () => {
    setIsSimulating(true);
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`);
        const data = await res.json();
        setStatusMessage(data.status_message);
        if (data.is_ready) {
          clearInterval(intervalId);
          await fetchAllData();
          setIsSimulating(false);
        }
      } catch {
        clearInterval(intervalId);
        setIsSimulating(false);
      }
    }, 2000);
  };

  // Trigger retraining
  const handleRunSimulation = async (newWeights: Weights) => {
    try {
      const res = await fetch(`${API_BASE}/api/retrain-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWeights)
      });
      if (res.ok) {
        setWeights(newWeights);
        startSimulationPolling();
      }
    } catch (err) {
      console.error('Error triggering simulation:', err);
    }
  };



  return (
    <div className="min-h-screen bg-iplDark text-slate-100 flex flex-col font-sans relative antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-iplDark/75 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white select-none">
            IPL DYNASTY <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
          </span>
        </div>

        {/* Tab Selection */}
        <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'predictions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Predictions
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'teams' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Team Analysis
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </nav>
      </header>

      {/* Main Layout */}
      {!isReady ? (
        // Initialization Loader
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Initializing Dynasty Engine</h2>
            <p className="text-sm text-slate-400 leading-normal">{statusMessage}</p>
          </div>
          <p className="text-[10px] text-slate-500 max-w-xs font-light">
            Training ML classifiers (Random Forest, XGBoost, etc.) and evaluating cross-validation metrics. This only happens on startup or custom uploads.
          </p>
        </div>
      ) : (
        // Dashboard Content
        <div className="flex-1 flex flex-col lg:flex-row px-6 md:px-12 py-8 gap-8 max-w-[1400px] w-full mx-auto">
          {/* Main Panel */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    predictions={predictions}
                    onNavigateToPredictions={() => setActiveTab('predictions')}
                  />
                )}
                {activeTab === 'predictions' && (
                  <PredictionsView predictions={predictions} />
                )}
                {activeTab === 'teams' && (
                  <TeamAnalysisView teams={teams} />
                )}
                {activeTab === 'analytics' && analytics && (
                  <AnalyticsView analytics={analytics} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Sidebar controls */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <SimulationControl
                weights={weights}
                isSimulating={isSimulating}
                onRunSimulation={handleRunSimulation}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-6 px-12 text-center text-xs text-slate-600 font-light flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} IPL Dynasty AI. Built with Vite, React, FastAPI and XGBoost.</span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" /> Sports Analytics Engine v1.0
        </span>
      </footer>
    </div>
  );
}
