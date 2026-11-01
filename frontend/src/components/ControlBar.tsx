import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActiveTab } from '../types';

interface ControlBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  deliveryDate: string;
  onDateChange: (date: string) => void;
  cutoffHour: number;
  onCutoffChange: (hour: number) => void;
  isLoading: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  activeTab,
  onTabChange,
  deliveryDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  isLoading,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(cutoffHour);
  const [isPendingSync, setIsPendingSync] = useState<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSliderValue(cutoffHour);
    setIsPendingSync(false);
  }, [cutoffHour]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSliderChange = (newVal: number) => {
    setSliderValue(newVal);
    setIsPendingSync(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsPendingSync(false);
      onCutoffChange(newVal);
    }, 2000);
  };

  const handleSliderCommit = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (sliderValue !== cutoffHour) {
      setIsPendingSync(false);
      onCutoffChange(sliderValue);
    }
  };

  const handlePresetClick = (val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSliderValue(val);
    setIsPendingSync(false);
    onCutoffChange(val);
  };

  const currentDay = parseInt(deliveryDate.split('-')[2] || '10', 10);

  const handlePrevDay = () => {
    if (currentDay > 1) {
      const nextDay = String(currentDay - 1).padStart(2, '0');
      onDateChange(`2026-01-${nextDay}`);
    }
  };

  const handleNextDay = () => {
    if (currentDay < 31) {
      const nextDay = String(currentDay + 1).padStart(2, '0');
      onDateChange(`2026-01-${nextDay}`);
    }
  };

  return (
    <div className="bg-[#f0f4f1] pt-6 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Title & Controls Header (Donezo Inspired) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Controls: Date Picker & Cutoff Slider */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Delivery Day Pill Selector */}
            <div className="flex items-center bg-white border border-slate-300 rounded-full shadow-card px-2 py-1">
              <button
                onClick={handlePrevDay}
                disabled={currentDay <= 1}
                title="Previous Day"
                className="p-1 rounded-full text-[#4b5563] hover:text-[#111827] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1.5 px-2">
                <Calendar className="w-4 h-4 text-[#175c3b] shrink-0" />
                <select
                  value={deliveryDate}
                  onChange={(e) => {
                    if (e.target.value) onDateChange(e.target.value);
                  }}
                  className="bg-transparent text-[#111827] text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayStr = String(i + 1).padStart(2, '0');
                    const val = `2026-01-${dayStr}`;
                    return (
                      <option key={val} value={val} className="text-[#111827]">
                        {`Jan ${dayStr}, 2026`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={handleNextDay}
                disabled={currentDay >= 31}
                title="Next Day"
                className="p-1 rounded-full text-[#4b5563] hover:text-[#111827] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Cutoff Gate Closure Pill */}
            <div className="flex items-center space-x-2.5 bg-white border border-slate-300 rounded-full shadow-card px-4 py-1.5">
              <Clock className="w-4 h-4 text-[#175c3b] shrink-0" />
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#111827] whitespace-nowrap">
                  Cutoff {String(sliderValue).padStart(2, '0')}:00 UK
                </span>
                {isPendingSync && (
                  <span className="text-[10px] text-amber-700 font-bold animate-pulse">
                    (syncing...)
                  </span>
                )}
                <input
                  id="cutoff-hour-slider"
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={sliderValue}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  onPointerUp={handleSliderCommit}
                  onMouseUp={handleSliderCommit}
                  onTouchEnd={handleSliderCommit}
                  className="w-16 accent-[#175c3b] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
                <button
                  onClick={() => handlePresetClick(12)}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    sliderValue === 12
                      ? 'bg-[#175c3b] text-white'
                      : 'bg-slate-100 text-[#4b5563] hover:bg-slate-200'
                  }`}
                >
                  12h
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center space-x-1.5 text-xs text-[#175c3b] font-bold">
                <div className="w-2 h-2 rounded-full bg-[#175c3b] animate-ping"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Pill Navigation Row */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-full border border-slate-200 shadow-card w-fit">
          <button
            onClick={() => onTabChange('decision')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'decision'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'text-[#4b5563] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            Day-Ahead Forecast
          </button>

          <button
            onClick={() => onTabChange('accuracy')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'accuracy'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'text-[#4b5563] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            Accuracy & Risk
          </button>

          <button
            onClick={() => onTabChange('procurement')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'procurement'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'text-[#4b5563] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            Procurement Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
