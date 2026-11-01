import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {   Download, Table, Eye, Wind } from 'lucide-react';
import { ForecastResponse } from '../types';

interface DayAheadViewProps {
  data: ForecastResponse | null;
  cutoffHour: number;
}

export const DayAheadView: React.FC<DayAheadViewProps> = ({ data, cutoffHour }) => {
  const [showTable, setShowTable] = useState(false);

  const { chartData, metrics } = useMemo(() => {
    if (!data || !data.points || data.points.length === 0) {
      return { chartData: [], metrics: null };
    }

    let minGen = Infinity;
    let maxGen = -Infinity;
    let totalMW = 0;
    let peakPeriod = '';

    const formatted = data.points.map((pt, idx) => {
      const dt = new Date(pt.startTime);
      const timeLabel = dt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      const gen = Math.round(pt.generation * 10) / 10;
      totalMW += gen;

      if (gen > maxGen) {
        maxGen = gen;
        peakPeriod = timeLabel;
      }
      if (gen < minGen) {
        minGen = gen;
      }

      return {
        sp: idx + 1,
        time: timeLabel,
        generation: gen,
        publishTime: new Date(pt.publishTime).toLocaleTimeString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        }),
      };
    });

    const avgGen = Math.round(totalMW / formatted.length);
    const totalGWh = Math.round((totalMW * 0.5) / 100) / 10;

    return {
      chartData: formatted,
      metrics: {
        minGen: Math.round(minGen),
        maxGen: Math.round(maxGen),
        avgGen,
        totalGWh,
        peakPeriod,
      },
    };
  }, [data]);

  const handleExportCSV = () => {
    if (!data || !data.points) return;
    const headers = ['Settlement_Period', 'Start_Time_UTC', 'Forecast_MW', 'Publish_Time_UTC'];
    const rows = data.points.map((p, i) => [
      i + 1,
      p.startTime,
      p.generation,
      p.publishTime,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wind_forecast_${data.delivery_date}_cutoff_${cutoffHour}h.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Wind className="w-10 h-10 text-[#175c3b] animate-spin mb-3" />
        <h3 className="text-base font-bold text-[#111827]">Loading Forecast Telemetry...</h3>
        <p className="text-xs text-[#4b5563] mt-1">Retrieving verified Elexon WINDFOR dataset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row (Donezo Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Peak Generation (Donezo Deep Forest Green Card) */}
        <div className="bg-[#175c3b] text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#d1fae5] tracking-wide">
              Peak Generation
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {metrics?.maxGen.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#a7f3d0] ml-2">MW</span>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22704b] text-[#d1fae5] w-fit">
            Expected around {metrics?.peakPeriod} UTC
          </div>
        </div>

        {/* Card 2: Minimum Trough (Donezo Crisp White Card) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Minimum Trough
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {metrics?.minGen.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">MW</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            Lowest generation period
          </div>
        </div>

        {/* Card 3: Total Expected Energy */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Total Day Energy
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {metrics?.totalGWh.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">GWh</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            Across 48 Settlement Periods
          </div>
        </div>

        {/* Card 4: Average Dispatch */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Average Dispatch
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {metrics?.avgGen.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">MW</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            24h mean fleet generation
          </div>
        </div>
      </div>

      {/* Main Chart Container (Donezo Crisp White Card) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              Half-Hourly Wind Generation Profile
            </h2>
            <p className="text-xs text-[#4b5563] font-medium mt-0.5">
              Available at {String(cutoffHour).padStart(2, '0')}:00 UK on D-1 for delivery on {data.delivery_date}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-[#111827] border border-slate-300 shadow-card transition-colors"
            >
              <Table className="w-3.5 h-3.5 text-[#175c3b]" />
              <span>{showTable ? 'Hide Table' : 'Table View'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-slate-50 text-[#111827] border border-slate-300 shadow-card transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#175c3b]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Clean Recharts Area Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="donezoWindGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#175c3b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#52b788" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                        <div className="text-[#6b7280] font-semibold mb-1">
                          SP {d.sp} • {d.time} UTC
                        </div>
                        <div className="text-base font-extrabold text-[#111827]">
                          {d.generation.toLocaleString()} MW
                        </div>
                        <div className="text-[11px] text-[#4b5563] mt-1 font-medium">
                          Published: {d.publishTime} UTC
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {metrics && (
                <ReferenceLine
                  y={metrics.avgGen}
                  stroke="#175c3b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Avg ${metrics.avgGen} MW`,
                    fill: '#175c3b',
                    fontSize: 11,
                    fontWeight: 600,
                    position: 'insideTopLeft',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="generation"
                stroke="#175c3b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#donezoWindGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expandable Telemetry Table */}
      {showTable && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#175c3b]" />
              Settlement Period Audit Trail
            </h3>
            <span className="text-xs text-[#4b5563] font-semibold">48 Half-Hour Periods</span>
          </div>
          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f0f4f1] text-[#111827] uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Target Time (UTC)</th>
                  <th className="py-3 px-4">Forecast Output</th>
                  <th className="py-3 px-4">Model Publish Time</th>
                  <th className="py-3 px-4">Cutoff Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {chartData.map((row) => (
                  <tr key={row.sp} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-[#111827]">SP {row.sp}</td>
                    <td className="py-2.5 px-4 text-[#374151] font-medium">{row.time}</td>
                    <td className="py-2.5 px-4 text-[#175c3b] font-extrabold">{row.generation.toLocaleString()} MW</td>
                    <td className="py-2.5 px-4 text-[#4b5563] font-medium">{row.publishTime}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] text-[#175c3b] bg-[#eaf5ed] border border-[#c3e5d2] px-2.5 py-0.5 rounded-full font-bold">
                        Pre-Cutoff
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
