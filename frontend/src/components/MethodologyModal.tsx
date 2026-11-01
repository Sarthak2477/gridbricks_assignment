import React from 'react';
import { X, ShieldCheck, Clock, Layers, BarChart3, Cpu } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-forest-800" />
              AeroGrid Desk: Architecture & Methodology
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Technical Briefing & Client Pitch Reference Guide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 pt-5 text-xs leading-relaxed">
          {/* Section 1: The Commercial Problem */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-forest-800" />
              1. The UK Day-Ahead Market Problem Setting
            </h3>
            <p className="text-slate-600">
              The client operates a UK energy supply desk. Electricity cannot be stored at scale economically, so consumer demand must match generation continuously. To procure electricity from the wholesale Day-Ahead Market, traders must commit capital on <strong>Day D-1</strong> before market gate closure (standard: <strong>12:00 noon UK time</strong>).
            </p>
            <p className="text-slate-600">
              Because wind is weather-dependent, traders rely on forecast models. If wind under-generates, the utility must buy expensive balancing energy on the imbalance settlement market.
            </p>
          </div>

          {/* Section 2: Look-Ahead Bias & "No Peeking" */}
          <div className="space-y-2 bg-forest-50/70 border border-forest-100 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-forest-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-forest-800" />
              2. Eliminating Look-Ahead Bias ("The No-Peeking Rule")
            </h3>
            <p className="text-forest-900/90">
              In academic backtesting, models frequently commit <em>Look-Ahead Bias</em> by using forecasts published at 15:00 or 18:00 on D-1. A real trading desk cannot see the future.
            </p>
            <div className="font-mono text-[11px] bg-white p-3 rounded-xl border border-forest-200/60 text-forest-950 shadow-sm">
              <code>Cutoff Instant = (Delivery Date - 1 day) at cutoff_hour (Europe/London to UTC)</code>
              <br />
              <code>Filter: WINDFOR.publishTime &le; Cutoff Instant</code>
              <br />
              <code>Selection: groupby(startTime).latest(publishTime)</code>
            </div>
            <p className="text-forest-800/80 text-[11px]">
              This guarantees that our evaluation mathematically replicates the real informational state of the trader at gate closure.
            </p>
          </div>

          {/* Section 3: Statistical Metrics Formulation */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-forest-800" />
              3. Quantitative Error Formulation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 font-mono text-[11px]">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-slate-900 font-bold block mb-1">MAE (Mean Absolute Error)</span>
                <code>MAE = (1/N) * &Sigma; |Forecast - Actual|</code>
                <p className="text-slate-500 font-sans text-[11px] mt-1">Average forecast deviation magnitude.</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-slate-900 font-bold block mb-1">RMSE</span>
                <code>RMSE = &radic;[ (1/N) * &Sigma; (Forecast - Actual)&sup2; ]</code>
                <p className="text-slate-500 font-sans text-[11px] mt-1">Penalizes large outlier misses.</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-slate-900 font-bold block mb-1">Forecast Bias</span>
                <code>Bias = (1/N) * &Sigma; (Forecast - Actual)</code>
                <p className="text-slate-500 font-sans text-[11px] mt-1">&gt; 0 indicates systematic over-forecasting.</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                <span className="text-slate-900 font-bold block mb-1">P90 Reserve Margin</span>
                <code>P90 = 90th percentile of |Error|</code>
                <p className="text-slate-500 font-sans text-[11px] mt-1">Value-at-Risk spinning reserve threshold.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Tech Stack & Architecture for Tech Lead */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-forest-800" />
              4. System Architecture & Engineering Practices
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li>
                <strong>FastAPI Core with Pure Functional Logic:</strong> Domain logic in <code className="text-forest-900 font-semibold">logic.py</code> is 100% decoupled from I/O and tested with Pytest.
              </li>
              <li>
                <strong>Two-Tier In-Memory + Disk Caching:</strong> Elexon stream datasets are cached in RAM for sub-millisecond retrieval and persisted to disk via Pickle serialization to prevent latency and external API rate-limiting.
              </li>
              <li>
                <strong>Single Batch Temporal Window:</strong> Reduced 62 consecutive HTTP requests to 2 batch queries, decreasing cold query latency from 30s to &lt;2s.
              </li>
              <li>
                <strong>Containerized Deployment:</strong> Dockerized with multi-stage build ready for Heroku or Vercel deployment.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-forest-950 hover:bg-forest-900 text-white rounded-full text-xs font-semibold shadow-sm transition-colors"
          >
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
};
