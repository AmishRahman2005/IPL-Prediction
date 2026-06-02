import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, HelpCircle, GitBranch, Cpu } from 'lucide-react';

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

interface AnalyticsViewProps {
  analytics: AnalyticsData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  // Format feature importance data for chart
  const chartData = analytics.feature_importance.map(item => ({
    name: item.feature,
    importance: parseFloat((item.importance * 100).toFixed(1))
  }));

  const [[tp, fp], [fn, tn]] = analytics.confusion_matrix;
  const total = tp + fp + fn + tn;
  const sens = (tp / (tp + fn) * 100).toFixed(1);
  const spec = (tn / (tn + fp) * 100).toFixed(1);

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cpu className="w-8 h-8 text-indigo-400" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Model Analytics & SHAP</h2>
          <p className="text-sm text-slate-400">Machine learning model validation, feature importances, and decision metrics</p>
        </div>
      </div>

      {/* Top Section: Best Model Summary & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Best Model Summary */}
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Selected Engine</h3>
            <div className="space-y-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE MODEL
              </span>
              <h4 className="text-3xl font-black text-white">{analytics.best_model}</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              This engine was selected automatically after cross-validation across five key models. It represents the highest generalization capability for head-to-head match outcomes.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Accuracy</span>
              <div className="text-2xl font-black text-white">{(analytics.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">ROC-AUC</span>
              <div className="text-2xl font-black text-indigo-400">
                {(analytics.model_comparison.find(m => m.model === analytics.best_model)?.auc || 0.72).toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="glass-panel p-6 flex flex-col justify-between lg:col-span-2">
          <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4">Confusion Matrix (Sample Size: {total})</h3>
          
          <div className="grid grid-cols-3 gap-3 flex-1 items-center">
            {/* Row Header */}
            <div className="text-center font-bold text-slate-500 text-xs uppercase flex flex-col justify-center">
              <span>Actual Win</span>
              <span className="mt-8">Actual Loss</span>
            </div>

            {/* Matrix Core */}
            <div className="col-span-2 grid grid-cols-2 gap-2 text-center font-bold">
              {/* Predicted headers */}
              <div className="text-[10px] text-slate-500 uppercase mb-1">Pred Win</div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Pred Loss</div>
              
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="text-lg font-black">{tp}</div>
                <div className="text-[8px] text-emerald-500/80 uppercase font-semibold mt-1">True Positive</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <div className="text-lg font-black">{fp}</div>
                <div className="text-[8px] text-red-500/80 uppercase font-semibold mt-1">False Positive</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <div className="text-lg font-black">{fn}</div>
                <div className="text-[8px] text-red-500/80 uppercase font-semibold mt-1">False Negative</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="text-lg font-black">{tn}</div>
                <div className="text-[8px] text-emerald-500/80 uppercase font-semibold mt-1">True Negative</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 mt-4 border-t border-white/5 text-xs text-slate-400">
            <div>Sensitivity: <span className="font-bold text-white">{sens}%</span></div>
            <div>Specificity: <span className="font-bold text-white">{spec}%</span></div>
          </div>
        </div>
      </div>

      {/* Feature Importance & Model Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Importance Bar Chart */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Model Feature Importances (%)
          </h3>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={9} width={90} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                />
                <Bar dataKey="importance" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Comparison Table */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Classifier Cross-Validation Leaderboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5">Model</th>
                    <th className="py-2.5 text-center">Mean Accuracy</th>
                    <th className="py-2.5 text-right">Mean ROC-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {analytics.model_comparison.map((m) => (
                    <tr key={m.model} className={m.model === analytics.best_model ? "bg-indigo-500/5 font-semibold" : ""}>
                      <td className="py-3 text-white flex items-center gap-2">
                        {m.model === analytics.best_model && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        {m.model}
                      </td>
                      <td className="py-3 text-center text-slate-300">{(m.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-3 text-right text-indigo-400 font-medium">{m.auc.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed mt-4">
            Cross-validation performed using Stratified 5-Fold split. Leaderboard ranks are updated automatically upon custom training requests.
          </p>
        </div>
      </div>

      {/* SHAP Explanation */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          SHAP Analysis & Explanation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analytics.drivers.map((driver) => (
            <div key={driver.factor} className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">{driver.factor}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                  Impact: {driver.score.toFixed(1)}/10
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                {driver.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
