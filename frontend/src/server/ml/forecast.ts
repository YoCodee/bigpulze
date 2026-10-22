/**
 * Time-series forecasting untuk deret penjualan harian per produk per cabang.
 *
 * Implementasi PRD §10.3:
 * - Model utama: Holt-Winters aditif, periode 7 (alpha 0.3, beta 0.05, gamma 0.2).
 * - Fallback bertingkat: riwayat >= 21 hari -> Holt-Winters, 7..20 hari ->
 *   seasonal naive (rata-rata hari dengan posisi minggu yang sama), < 7 hari ->
 *   rata-rata bergerak.
 * - Interval: prediksi +/- 1.28 * sigma residual (kira-kira 80%).
 *
 * Semua fungsi di file ini adalah pure function (tanpa I/O) agar mudah diuji.
 */

export type ForecastModel = 'holt_winters_7' | 'seasonal_naive' | 'moving_avg';

export interface ForecastPoint {
  value: number;
  lower: number;
  upper: number;
}

export interface ForecastResult {
  model: ForecastModel;
  points: ForecastPoint[];
  /** Simpangan baku residual in-sample; dasar perhitungan interval. */
  sigma: number;
  /** Jumlah hari ke depan yang diprediksi. */
  horizon: number;
}

export interface HoltWintersOptions {
  seasonLength?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
}

export const SEASON_LENGTH = 7;
export const HW_ALPHA = 0.3;
export const HW_BETA = 0.05;
export const HW_GAMMA = 0.2;
/** Multiplier interval 80% (z-score 1.28). */
export const INTERVAL_MULTIPLIER = 1.28;
/** Ambang riwayat minimum untuk memakai masing-masing model. */
export const HW_MIN_HISTORY = 21;
export const SEASONAL_NAIVE_MIN_HISTORY = 7;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Memilih model sesuai PRD §10.3 (fallback bertingkat berdasarkan panjang riwayat).
 */
export function selectForecastModel(historyLength: number): ForecastModel {
  if (historyLength >= HW_MIN_HISTORY) return 'holt_winters_7';
  if (historyLength >= SEASONAL_NAIVE_MIN_HISTORY) return 'seasonal_naive';
  return 'moving_avg';
}

/**
 * Rata-rata bergerak: nilai prediksi konstan sebesar rata-rata window terakhir.
 */
export function movingAverageForecast(
  series: number[],
  horizon: number,
  window: number = SEASON_LENGTH
): number[] {
  if (series.length === 0 || horizon <= 0) return [];
  const slice = series.slice(-Math.max(1, window));
  const average = mean(slice);
  return Array.from({ length: horizon }, () => Math.max(0, average));
}

/**
 * Seasonal naive: untuk setiap langkah, ambil rata-rata nilai pada posisi
 * siklus minggu yang sama dalam deret.
 */
export function seasonalNaiveForecast(
  series: number[],
  horizon: number,
  seasonLength: number = SEASON_LENGTH
): number[] {
  if (series.length === 0 || horizon <= 0) return [];
  const n = series.length;
  const predictions: number[] = [];

  for (let step = 0; step < horizon; step++) {
    // Posisi siklus target: hari pertama prediksi adalah hari setelah
    // observasi terakhir, sehingga harus selaras dengan siklus kalender.
    const targetPosition = (n + step) % seasonLength;
    const bucket: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i % seasonLength === targetPosition) {
        bucket.push(series[i]);
      }
    }
    predictions.push(Math.max(0, mean(bucket)));
  }

  return predictions;
}

export interface HoltWintersResult {
  values: number[];
  residuals: number[];
}

/**
 * Holt-Winters aditif (musiman, periode 7).
 * Butuh minimal 2 * seasonLength observasi agar inisialisasi level/trend valid.
 */
export function holtWintersForecast(
  series: number[],
  horizon: number,
  options: HoltWintersOptions = {}
): HoltWintersResult {
  const m = options.seasonLength ?? SEASON_LENGTH;
  const alpha = options.alpha ?? HW_ALPHA;
  const beta = options.beta ?? HW_BETA;
  const gamma = options.gamma ?? HW_GAMMA;
  const n = series.length;

  if (n < 2 * m || horizon <= 0) {
    return { values: [], residuals: [] };
  }

  // Inisialisasi: rata-rata musim pertama, tren antar musim, indeks musiman.
  let level = mean(series.slice(0, m));
  let trend = (mean(series.slice(m, 2 * m)) - level) / m;
  const seasonal: number[] = new Array(n + m).fill(0);
  for (let i = 0; i < m; i++) {
    seasonal[i] = series[i] - level;
  }

  const residuals: number[] = [];

  for (let t = m; t < n; t++) {
    const previousSeasonal = seasonal[t - m];
    // One-step-ahead fit untuk residual.
    residuals.push(series[t] - (level + trend + previousSeasonal));

    const newLevel = alpha * (series[t] - previousSeasonal) + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    seasonal[t] = gamma * (series[t] - newLevel) + (1 - gamma) * previousSeasonal;

    level = newLevel;
    trend = newTrend;
  }

  const values: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const seasonalIndex = n - m + ((h - 1) % m);
    values.push(Math.max(0, level + h * trend + seasonal[seasonalIndex]));
  }

  return { values, residuals };
}

/**
 * Simpangan baku residual in-sample (dasar interval prediksi).
 */
export function computeResidualSigma(residuals: number[]): number {
  if (residuals.length === 0) return 0;
  const variance =
    residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length;
  return Math.sqrt(variance);
}

/**
 * Menjalankan forecast lengkap untuk sebuah deret penjualan harian.
 * Mengembalikan nilai prediksi beserta interval 80%.
 */
export function forecastSeries(series: number[], horizon: number): ForecastResult {
  const model = selectForecastModel(series.length);
  let values: number[] = [];
  let residuals: number[] = [];

  if (model === 'holt_winters_7') {
    const hw = holtWintersForecast(series, horizon);
    values = hw.values;
    residuals = hw.residuals;
  } else if (model === 'seasonal_naive') {
    values = seasonalNaiveForecast(series, horizon);
    residuals = series.length > 1 ? series.slice(1).map((value, index) => value - series[index]) : [];
  } else {
    values = movingAverageForecast(series, horizon);
    residuals = series.length > 1 ? series.slice(1).map((value, index) => value - series[index]) : [];
  }

  const sigma = computeResidualSigma(residuals);

  const points: ForecastPoint[] = values.map((value) => ({
    value: round2(value),
    lower: round2(Math.max(0, value - INTERVAL_MULTIPLIER * sigma)),
    upper: round2(value + INTERVAL_MULTIPLIER * sigma),
  }));

  return { model, points, sigma: round2(sigma), horizon };
}

/**
 * Backtest WAPE (PRD §10.3): latih tanpa 7 hari terakhir, prediksi 7 hari itu,
 * WAPE = SUM|aktual - prediksi| / SUM aktual.
 * Mengembalikan null bila data tidak cukup atau total aktual nol.
 */
export function calculateWape(series: number[]): number | null {
  if (series.length < SEASONAL_NAIVE_MIN_HISTORY) return null;

  const holdout = Math.min(7, series.length - 1);
  const training = series.slice(0, series.length - holdout);
  const actual = series.slice(series.length - holdout);

  if (training.length === 0) return null;

  const model = selectForecastModel(training.length);
  let predicted: number[] = [];
  if (model === 'holt_winters_7') {
    predicted = holtWintersForecast(training, holdout).values;
  } else if (model === 'seasonal_naive') {
    predicted = seasonalNaiveForecast(training, holdout);
  } else {
    predicted = movingAverageForecast(training, holdout);
  }

  if (predicted.length !== actual.length) return null;

  let absoluteError = 0;
  let totalActual = 0;
  for (let i = 0; i < actual.length; i++) {
    absoluteError += Math.abs(actual[i] - predicted[i]);
    totalActual += actual[i];
  }

  if (totalActual === 0) return null;
  return round2((absoluteError / totalActual) * 100);
}
