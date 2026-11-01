import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {   ShieldCheck } from 'lucide-react';
import { ForecastResponse, ErrorMetrics } from '../types';

interface ProcurementSimulatorProps {
  forecastData: ForecastResponse | null;
  errorMetrics: ErrorMetrics | null;
}

export const ProcurementSimulator: React.FC<ProcurementSimulatorProps> = ({
  forecastData,
  errorMetrics,
}) => {
  const [peakDemandMW, setPeakDemandMW] = useState<number>(24000);
  const [marketPriceGBP, setMarketPriceGBP] = useState<number>(75);
  const [includeRiskBuffer, setIncludeRiskBuffer] = useState<boolean>(true);

  const reserveBufferMW = useMemo(() => {
    return errorMetrics ? Math.round(errorMetrics.abs_error_p90_mw) : 650;
  }, [errorMetrics]);

  const { simulationData, summary } = useMemo(() => {
    if (!forecastData || !forecastData.points || forecastData.points.length === 0) {
      return { simulationData: [], summary: null };
    }

    let totalDemandMWh = 0;
    let totalWindMWh = 0;
    let totalProcurementMWh = 0;
    let totalProcurementWithBufferMWh = 0;

    const data = forecastData.points.map((pt, idx) => {
      const dt = new Date(pt.startTime);
      const timeLabel = dt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });

      const sp = idx + 1;
      const morningPeak = Math.exp(-Math.pow((sp - 16) / 4, 2)) * 0.22;
      const eveningPeak = Math.exp(-Math.pow((sp - 36) / 5, 2)) * 0.28;
      const baseFactor = 0.55 + morningPeak + eveningPeak;
      const demand = Math.round(peakDemandMW * baseFactor);

      const wind = Math.round(pt.generation);
      const netThermal = Math.max(0, demand - wind);
      const netThermalWithBuffer = Math.max(0, demand - wind + (includeRiskBuffer ? reserveBufferMW : 0));

      totalDemandMWh += demand * 0.5;
      totalWindMWh += Math.min(demand, wind) * 0.5;
      totalProcurementMWh += netThermal * 0.5;
      totalProcurementWithBufferMWh += netThermalWithBuffer * 0.5;

      return {
        sp,
        time: timeLabel,
        wind,
        thermal: netThermal,
        demand,
        thermalBuffer: netThermalWithBuffer,
      };
    });

    const renewablePenetration = Math.round((totalWindMWh / totalDemandMWh) * 100);
    const estimatedCostGBP = Math.round((totalProcurementMWh * marketPriceGBP) / 1000);

    return {
      simulationData: data,
      summary: {
        totalDemandGWh: Math.round(totalDemandMWh / 100) / 10,
        totalProcurementGWh: Math.round(totalProcurementMWh / 100) / 10,
        renewablePenetration,
        estimatedCostGBP,
      },
    };
  }, [forecastData, peakDemandMW, marketPriceGBP, includeRiskBuffer, reserveBufferMW]);

  if (!forecastData || simulationData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Simulation Controls (Donezo Clean Card) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              Net Thermal & Market Procurement Simulator
            </h2>
            <p className="text-xs text-[#4b5563] font-medium mt-0.5">
              Offset consumer demand against forecast wind to calculate wholesale purchase volumes
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPeakDemandMW(18000)}
              className={`text-xs px-4 py-2 rounded-full font-bold transition-all ${
                peakDemandMW === 18000
                  ? 'bg-[#175c3b] text-white shadow-sm'
                  : 'bg-slate-100 text-[#4b5563] hover:text-[#111827] hover:bg-slate-200'
              }`}
            >
              Weekend (18 GW)
            </button>
            <button
              onClick={() => setPeakDemandMW(24000)}
              className={`text-xs px-4 py-2 rounded-full font-bold transition-all ${
                peakDemandMW === 24000
                  ? 'bg-[#175c3b] text-white shadow-sm'
                  : 'bg-slate-100 text-[#4b5563] hover:text-[#111827] hover:bg-slate-200'
              }`}
            >
              Standard (24 GW)
            </button>
            <button
              onClick={() => setPeakDemandMW(32000)}
              className={`text-xs px-4 py-2 rounded-full font-bold transition-all ${
                peakDemandMW === 32000
                  ? 'bg-[#175c3b] text-white shadow-sm'
                  : 'bg-slate-100 text-[#4b5563] hover:text-[#111827] hover:bg-slate-200'
              }`}
            >
              Cold Snap (32 GW)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#4b5563] font-bold">Consumer Peak Demand</span>
              <span className="font-extrabold text-[#111827] text-sm">{peakDemandMW.toLocaleString()} MW</span>
            </div>
            <input
              type="range"
              min="10000"
              max="40000"
              step="1000"
              value={peakDemandMW}
              onChange={(e) => setPeakDemandMW(Number(e.target.value))}
              className="w-full accent-[#175c3b] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#4b5563] font-bold">Day-Ahead Wholesale Price</span>
              <span className="font-extrabold text-[#111827] text-sm">£{marketPriceGBP} / MWh</span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              step="5"
              value={marketPriceGBP}
              onChange={(e) => setMarketPriceGBP(Number(e.target.value))}
              className="w-full accent-[#175c3b] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#175c3b]" />
                P90 Risk Reserve
              </div>
              <div className="text-[11px] text-[#4b5563] font-semibold mt-0.5">
                +{reserveBufferMW.toLocaleString()} MW buffer against wind deficit
              </div>
            </div>
            <button
              onClick={() => setIncludeRiskBuffer(!includeRiskBuffer)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                includeRiskBuffer ? 'bg-[#175c3b]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  includeRiskBuffer ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Donezo Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Thermal Needed (Donezo Deep Green Card) */}
        <div className="bg-[#175c3b] text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#d1fae5] tracking-wide">
              Thermal / Market Needed
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {summary?.totalProcurementGWh.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#a7f3d0] ml-2">GWh</span>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22704b] text-[#d1fae5] w-fit">
            Wholesale volume to purchase
          </div>
        </div>

        {/* Card 2: Wind Coverage */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Wind Coverage Ratio
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {summary?.renewablePenetration}%
            </span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            Directly serves consumer demand
          </div>
        </div>

        {/* Card 3: Total Customer Demand */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Total Day Demand
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              {summary?.totalDemandGWh.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-[#6b7280] ml-2">GWh</span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            24-hour total delivery load
          </div>
        </div>

        {/* Card 4: Estimated Market Spend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4b5563] tracking-wide">
              Estimated Market Spend
            </span>
             
          </div>
          <div className="my-4">
            <span className="text-4xl font-extrabold text-[#111827] tracking-tight">
              £{summary?.estimatedCostGBP.toLocaleString()}k
            </span>
          </div>
          <div className="text-xs text-[#4b5563] font-medium">
            At £{marketPriceGBP}/MWh index
          </div>
        </div>
      </div>

      {/* Stacked Dispatch Balance Chart */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="pb-5 mb-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              Dispatch Balance: Wind vs Wholesale Procurement
            </h3>
            <p className="text-xs text-[#4b5563] font-medium mt-0.5">
              Wind serves baseload; thermal / market purchases fulfill residual net demand
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-bold text-[#374151]">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#175c3b]"></span>
              <span>Wind Generation</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#334155]"></span>
              <span>Thermal / Market</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="donezoWindStack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#175c3b" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#175c3b" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="donezoThermalStack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#334155" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#334155" stopOpacity={0.65} />
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
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                            <span className="text-[#4b5563] font-medium">Consumer Demand:</span>
                            <span className="font-extrabold text-[#111827]">{d.demand.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between gap-5">
                            <span className="text-[#4b5563] font-medium">Wind Forecast:</span>
                            <span className="font-extrabold text-[#175c3b]">{d.wind.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between gap-5">
                            <span className="text-[#4b5563] font-medium">Procurement Needed:</span>
                            <span className="font-extrabold text-[#334155]">{d.thermal.toLocaleString()} MW</span>
                          </div>
                          {includeRiskBuffer && (
                            <div className="flex justify-between gap-5 text-[#175c3b] pt-1.5 border-t border-slate-100 font-bold">
                              <span>With P90 Reserve:</span>
                              <span>{d.thermalBuffer.toLocaleString()} MW</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="wind"
                stackId="1"
                stroke="#175c3b"
                fill="url(#donezoWindStack)"
              />
              <Area
                type="monotone"
                dataKey="thermal"
                stackId="1"
                stroke="#334155"
                fill="url(#donezoThermalStack)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
