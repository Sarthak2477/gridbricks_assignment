import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ArrowUpRight, Calendar, Loader2 } from 'lucide-react';
import { ComparisonResponse, ErrorMetrics } from '../types';

interface AccuracyViewProps {
  comparisonData: ComparisonResponse | null;
  errorMetrics: ErrorMetrics | null;
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  isLoading: boolean;
}

export const AccuracyView: React.FC<AccuracyViewProps> = ({
  comparisonData,
  errorMetrics,
  startDate,
  endDate,
  onRangeChange,
  isLoading,
}) => {
  const [activeChart, setActiveChart] = useState<'overlay' | 'residuals'>('overlay');

  const chartData = (comparisonData?.series || []).map((pt, idx) => {
    const dt = new Date(pt.startTime);
    const timeLabel = dt.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    return {
      sp: idx + 1,
      time: timeLabel,
      forecast: pt.forecast !== null ? Math.round(pt.forecast) : null,
      actual: pt.actual !== null ? Math.round(pt.actual) : null,
      error: pt.error !== null ? Math.round(pt.error) : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Range Selection Bar (Donezo Minimal White Card) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">
            Accuracy & Uncertainty Evaluation
          </h2>
          <p className="text-xs text-[#4b5563] font-medium mt-0.5">
            Benchmarking decision-time forecasts against FUELHH actual generation
          </p>
        </div>

        {/* Date Inputs & Quick Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Date Pill */}
          <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-card">
            <Calendar className="w-4 h-4 text-[#175c3b]" />
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={(e) => onRangeChange(e.target.value, endDate)}
              className="bg-transparent text-[#111827] text-xs font-bold focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={endDate}
              onChange={(e) => onRangeChange(startDate, e.target.value)}
              className="bg-transparent text-[#111827] text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick Presets */}
          <button
            onClick={() => onRangeChange('2026-01-01', '2026-01-07')}
            className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all ${
              startDate === '2026-01-01' && endDate === '2026-01-07'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-[#4b5563]'
            }`}
          >
            Week 1
          </button>
          <button
            onClick={() => onRangeChange('2026-01-01', '2026-01-15')}
            className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all ${
              startDate === '2026-01-01' && endDate === '2026-01-15'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-[#4b5563]'
            }`}
          >
            Jan 1-15
          </button>
          <button
            onClick={() => onRangeChange('2026-01-16', '2026-01-31')}
            className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all ${
              startDate === '2026-01-16' && endDate === '2026-01-31'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-[#4b5563]'
            }`}
          >
            Jan 16-31
          </button>
          <button
            onClick={() => onRangeChange('2026-01-01', '2026-01-31')}
            className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all ${
              startDate === '2026-01-01' && endDate === '2026-01-31'
                ? 'bg-[#175c3b] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-[#4b5563]'
            }`}
          >
            Full Month
          </button>

          {isLoading && <Loader2 className="w-4 h-4 text-[#175c3b] animate-spin ml-1" />}
        </div>
      </div>

      {/* KPI Accuracy Cards (Donezo Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MAE (Donezo Deep Green Card) */}
        <div className="bg-[#175c3b] text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#d1fae5] tracking-wide">
              MAE (Mean Abs Error)
            </span>
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {errorMetrics ? Math.round(errorMetrics.mae_mw).toLocaleString() : '--'}
            </span>
            <span className="text-sm font-bold text-[#a7f3d0] ml-2">MW</span>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22704b] text-[#d1fae5] w-fit">
            Average per-period deviation
          </div>
        </div>

        {/* Card 2: RMSE (White Card) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              RMSE (Quadratic Penalty)
            </span>
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {errorMetrics ? Math.round(errorMetrics.rmse_mw).toLocaleString() : '--'}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">MW</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            Penalizes large outlier misses
          </div>
        </div>

        {/* Card 3: Forecast Bias */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Forecast Bias
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {errorMetrics
                ? `${errorMetrics.bias_mw >= 0 ? '+' : ''}${Math.round(errorMetrics.bias_mw).toLocaleString()}`
                : '--'}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">MW</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            {errorMetrics && errorMetrics.bias_mw >= 0 ? 'Slight over-forecast skew' : 'Slight under-forecast skew'}
          </div>
        </div>

        {/* Card 4: P90 Reserve Margin */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              P90 Reserve Margin
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {errorMetrics ? Math.round(errorMetrics.abs_error_p90_mw).toLocaleString() : '--'}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">MW</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            Value-at-Risk spinning reserve
          </div>
        </div>
      </div>

      {/* Main Comparison Chart (Donezo Clean Card) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              {activeChart === 'overlay' ? 'Forecast vs Outturn Generation' : 'Forecast Residuals (MW)'}
            </h3>
            <p className="text-xs text-[#4b5563] font-medium mt-0.5">
              {activeChart === 'overlay'
                ? 'Solid Green: Day-Ahead Forecast • Dashed Blue: Outturn Actual Generation'
                : 'Settlement period difference (Forecast - Actual)'}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setActiveChart('overlay')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeChart === 'overlay'
                  ? 'bg-[#175c3b] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setActiveChart('residuals')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeChart === 'residuals'
                  ? 'bg-[#175c3b] text-white shadow-sm'
                  : 'text-[#4b5563] hover:text-[#111827]'
              }`}
            >
              Residuals
            </button>
          </div>
        </div>

        {/* Charts Container */}
        <div className="h-80 w-full">
          {activeChart === 'overlay' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#4b5563"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  interval={3}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  domain={[0, 'auto']}
                  unit=" MW"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-elevated text-xs font-sans">
                          <div className="text-[#6b7280] font-semibold mb-2">
                            SP {d.sp} • {d.time} UTC
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between gap-5">
                              <span className="text-[#4b5563] font-medium">Forecast (WINDFOR):</span>
                              <span className="font-extrabold text-[#175c3b]">{d.forecast?.toLocaleString()} MW</span>
                            </div>
                            <div className="flex justify-between gap-5">
                              <span className="text-[#4b5563] font-medium">Actual (FUELHH):</span>
                              <span className="font-extrabold text-[#2563eb]">{d.actual?.toLocaleString()} MW</span>
                            </div>
                            <div className="flex justify-between gap-5 pt-1.5 border-t border-slate-100 font-bold">
                              <span className="text-[#111827]">Delta:</span>
                              <span className={d.error >= 0 ? 'text-[#175c3b]' : 'text-[#dc2626]'}>
                                {d.error >= 0 ? '+' : ''}{d.error?.toLocaleString()} MW
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
                />
                <Line
                  name="Forecast (WINDFOR)"
                  type="monotone"
                  dataKey="forecast"
                  stroke="#175c3b"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  name="Actual (FUELHH)"
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#4b5563"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  interval={3}
                  tickMargin={10}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  unit=" MW"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-elevated text-xs font-sans">
                          <div className="text-[#6b7280] font-semibold mb-1">
                            SP {d.sp} • {d.time} UTC
                          </div>
                          <div className="text-[#111827] font-bold">
                            Forecast Error:{' '}
                            <span className={d.error >= 0 ? 'text-[#175c3b]' : 'text-[#dc2626]'}>
                              {d.error >= 0 ? '+' : ''}{d.error} MW
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                <Bar
                  dataKey="error"
                  name="Forecast Error (MW)"
                  fill="#175c3b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
