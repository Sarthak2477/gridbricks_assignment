import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenMethodology: () => void;
  systemStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMethodology, systemStatus }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand (Donezo Style) */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#175c3b] flex items-center justify-center text-white shadow-sm">
            <svg
              className="w-5 h-5 text-[#a7f3d0]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v9l5 4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-[#111827]">
                AeroGrid
              </span>
              <span className="text-xs font-bold text-[#175c3b] bg-[#eaf5ed] px-2.5 py-0.5 rounded-full border border-[#c3e5d2]">
                UK Day-Ahead
              </span>
            </div>
            <p className="text-xs text-[#4b5563] font-medium">
              Wind Forecast & Thermal Procurement Intelligence
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3">
          {/* Dataset Scope Pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-[#374151] font-semibold border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#175c3b]"></span>
            <span>Elexon Jan 2026 Scope</span>
          </div>

          {/* System Status Pill */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-[#374151] font-semibold shadow-card">
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'ok' ? 'bg-[#175c3b]' : 'bg-[#10b981] animate-pulse'}`}></span>
            <span>{systemStatus === 'ok' ? 'BMRS Connected' : 'Telemetry Verified'}</span>
          </div>

          {/* Methodology Pill Button */}
          <button
            onClick={onOpenMethodology}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-[#111827] border border-slate-300 rounded-full text-xs font-bold shadow-card transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#175c3b]" />
            <span>Methodology</span>
          </button>
        </div>
      </div>
    </header>
  );
};
