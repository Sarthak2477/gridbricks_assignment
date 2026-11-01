import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { DayAheadView } from './components/DayAheadView';
import { AccuracyView } from './components/AccuracyView';
import { ProcurementSimulator } from './components/ProcurementSimulator';
import { MethodologyModal } from './components/MethodologyModal';
import {
  ForecastResponse,
  ComparisonResponse,
  ErrorMetrics,
  ActiveTab,
} from './types';
import {
  fetchForecast,
  fetchComparison,
  fetchErrorMetrics,
  checkHealth,
} from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('decision');
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-01-10');
  const [cutoffHour, setCutoffHour] = useState<number>(12);

  // Range for accuracy tab
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-15');

  // API Data States
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<string>('checking');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Health check on mount
  useEffect(() => {
    checkHealth().then((res) => setSystemStatus(res.status));
  }, []);

  // Fetch forecast and comparison data when deliveryDate or cutoffHour changes
  const loadDayData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fc, cmp] = await Promise.all([
        fetchForecast(deliveryDate, cutoffHour),
        fetchComparison(deliveryDate, cutoffHour),
      ]);
      setForecastData(fc);
      setComparisonData(cmp);
    } catch (err) {
      console.error('Error loading day data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deliveryDate, cutoffHour]);

  // Fetch error metrics when date range or cutoff changes
  const loadMetricsData = useCallback(async () => {
    try {
      const metrics = await fetchErrorMetrics(startDate, endDate, cutoffHour);
      setErrorMetrics(metrics);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  }, [startDate, endDate, cutoffHour]);

  useEffect(() => {
    loadDayData();
  }, [loadDayData]);

  useEffect(() => {
    loadMetricsData();
  }, [loadMetricsData]);

  const handleRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f1] text-[#111827] font-sans">
      {/* Top Header */}
      <Header
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        systemStatus={systemStatus}
      />

      {/* Primary Control & Navigation Bar */}
      <ControlBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        deliveryDate={deliveryDate}
        onDateChange={setDeliveryDate}
        cutoffHour={cutoffHour}
        onCutoffChange={setCutoffHour}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'decision' && (
          <DayAheadView
            data={forecastData}
            cutoffHour={cutoffHour}
          />
        )}

        {activeTab === 'accuracy' && (
          <AccuracyView
            comparisonData={comparisonData}
            errorMetrics={errorMetrics}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementSimulator
            forecastData={forecastData}
            errorMetrics={errorMetrics}
          />
        )}
      </main>

      {/* Minimalist Clean Footer */}
      <footer className="border-t border-slate-200/90 bg-white/80 py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-800">
            AeroGrid Desk • UK Day-Ahead Wind Forecast & Procurement Portal
          </div>
          <div className="text-slate-500 font-medium">
            Dataset: Elexon BMRS WINDFOR & FUELHH (January 2026 Scope)
          </div>
        </div>
      </footer>

      {/* Methodology & Pitch Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default App;
