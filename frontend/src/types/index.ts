export interface ForecastPoint {
  startTime: string;
  publishTime: string;
  generation: number;
}

export interface ForecastResponse {
  delivery_date: string;
  cutoff_utc: string;
  points: ForecastPoint[];
}

export interface ComparisonPoint {
  startTime: string;
  forecast: number;
  actual: number | null;
  error: number | null;
}

export interface ComparisonResponse {
  delivery_date: string;
  cutoff_utc: string;
  series: ComparisonPoint[];
}

export interface ErrorMetrics {
  n: number;
  bias_mw: number;
  mae_mw: number;
  rmse_mw: number;
  abs_error_p50_mw: number;
  abs_error_p90_mw: number;
  error_p10_mw: number;
  error_p90_mw: number;
}

export type ActiveTab = 'decision' | 'accuracy' | 'procurement';

