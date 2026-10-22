import { describe, it, expect } from 'vitest';
import {
  selectForecastModel,
  movingAverageForecast,
  seasonalNaiveForecast,
  holtWintersForecast,
  forecastSeries,
  calculateWape,
  computeResidualSigma,
  HW_MIN_HISTORY,
} from '@/server/ml/forecast';

/** Deret musiman sintetis: pola mingguan Sen–Min + tren mingguan. */
const WEEK_PATTERN = [30, 28, 32, 35, 40, 50, 45];

function syntheticSeries(weeks: number, trendPerWeek = 0): number[] {
  const out: number[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      out.push(WEEK_PATTERN[d] + trendPerWeek * w);
    }
  }
  return out;
}

describe('selectForecastModel', () => {
  it('memakai Holt-Winters untuk riwayat >= 21 hari', () => {
    expect(selectForecastModel(HW_MIN_HISTORY)).toBe('holt_winters_7');
    expect(selectForecastModel(45)).toBe('holt_winters_7');
  });

  it('memakai seasonal naive untuk riwayat 7 sampai 20 hari', () => {
    expect(selectForecastModel(7)).toBe('seasonal_naive');
    expect(selectForecastModel(20)).toBe('seasonal_naive');
  });

  it('memakai rata-rata bergerak untuk riwayat < 7 hari', () => {
    expect(selectForecastModel(1)).toBe('moving_avg');
    expect(selectForecastModel(6)).toBe('moving_avg');
  });
});

describe('movingAverageForecast', () => {
  it('menghasilkan prediksi konstan sebesar rata-rata window terakhir', () => {
    const result = movingAverageForecast([10, 20, 30], 3, 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(20);
    expect(result[2]).toBe(20);
  });

  it('mengembalikan array kosong untuk deret kosong', () => {
    expect(movingAverageForecast([], 5)).toEqual([]);
  });
});

describe('seasonalNaiveForecast', () => {
  it('memakai rata-rata pada posisi siklus minggu yang sama', () => {
    // Dua siklus identik: 10, 20, 30, 40, 50, 60, 70
    const series = [10, 20, 30, 40, 50, 60, 70, 10, 20, 30, 40, 50, 60, 70];
    const result = seasonalNaiveForecast(series, 7);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe(10);
    expect(result[5]).toBe(60);
    expect(result[6]).toBe(70);
  });
});

describe('holtWintersForecast', () => {
  it('tidak menghasilkan nilai negatif pada deret dengan tren turun', () => {
    const series = syntheticSeries(6, -4);
    const { values } = holtWintersForecast(series, 7);
    expect(values).toHaveLength(7);
    values.forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
  });

  it('mengembalikan array kosong bila riwayat terlalu pendek', () => {
    const { values } = holtWintersForecast([10, 20, 30], 7);
    expect(values).toEqual([]);
  });
});

describe('computeResidualSigma', () => {
  it('menghitung simpangan baku residual', () => {
    const sigma = computeResidualSigma([2, -2, 2, -2]);
    expect(sigma).toBeCloseTo(2, 5);
  });

  it('mengembalikan nol untuk residual kosong', () => {
    expect(computeResidualSigma([])).toBe(0);
  });
});

describe('forecastSeries', () => {
  it('memilih model sesuai panjang riwayat dan menghasilkan horizon yang diminta', () => {
    const short = forecastSeries([10, 12, 11, 9, 10, 8], 7);
    expect(short.model).toBe('moving_avg');
    expect(short.points).toHaveLength(7);

    const medium = forecastSeries(syntheticSeries(2), 7);
    expect(medium.model).toBe('seasonal_naive');
    expect(medium.points).toHaveLength(7);

    const long = forecastSeries(syntheticSeries(5), 30);
    expect(long.model).toBe('holt_winters_7');
    expect(long.points).toHaveLength(30);
  });

  it('tidak menghasilkan nilai negatif dan interval menutupi nilai tengah', () => {
    const result = forecastSeries(syntheticSeries(5), 14);
    result.points.forEach((point) => {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.lower).toBeLessThanOrEqual(point.value);
      expect(point.upper).toBeGreaterThanOrEqual(point.value);
      expect(point.lower).toBeGreaterThanOrEqual(0);
    });
  });

  it('mengembalikan titik kosong untuk deret kosong', () => {
    const result = forecastSeries([], 7);
    expect(result.points).toHaveLength(0);
  });
});

describe('calculateWape', () => {
  it('mencapai WAPE < 20% pada deret musiman sintetis', () => {
    const series = syntheticSeries(6);
    const wape = calculateWape(series);
    expect(wape).not.toBeNull();
    expect(wape as number).toBeLessThan(20);
  });

  it('mengembalikan null bila riwayat kurang dari 7 hari', () => {
    expect(calculateWape([10, 20, 30])).toBeNull();
  });

  it('mengembalikan null bila total aktual nol', () => {
    expect(calculateWape(new Array(14).fill(0))).toBeNull();
  });
});
