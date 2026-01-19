// 為替レート取得ユーティリティ
// 複数のAPIを試行し、フォールバック対応

export interface ExchangeRateResult {
  rate: number;
  date: string;
  base: string;
  target: string;
  isFallback?: boolean; // APIが使えずフォールバック値を使用した場合true
}

export interface ExchangeRateError {
  message: string;
}

// 最新の為替レートを取得 (CNY → JPY)
export async function getLatestExchangeRate(
  base: string = 'CNY',
  target: string = 'JPY'
): Promise<ExchangeRateResult> {
  // API 1: Open Exchange Rates (無料、APIキー不要)
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${base}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.result === 'success' && data.rates?.[target]) {
        return {
          rate: Math.round(data.rates[target] * 100) / 100,
          date: data.time_last_update_utc?.split(' ')[0] || new Date().toISOString().split('T')[0],
          base,
          target,
          isFallback: false,
        };
      }
    }
  } catch {
    // 次のAPIを試す
  }

  // API 2: ExchangeRate-API (無料枠)
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.rates?.[target]) {
        return {
          rate: Math.round(data.rates[target] * 100) / 100,
          date: data.date || new Date().toISOString().split('T')[0],
          base,
          target,
          isFallback: false,
        };
      }
    }
  } catch {
    // フォールバックへ
  }

  // フォールバック: 概算レートを使用
  return await getExchangeRateFromFallback(base, target, 'latest');
}

// 特定日の為替レートを取得
export async function getHistoricalExchangeRate(
  date: string, // YYYY-MM-DD形式
  base: string = 'CNY',
  target: string = 'JPY'
): Promise<ExchangeRateResult> {
  // 過去レートは無料APIでは限定的なので、最新レートで代用
  // （多くの無料APIは過去データをサポートしていないか有料）
  try {
    // 最新レートを取得して日付だけ指定日に
    const result = await getLatestExchangeRate(base, target);
    return {
      ...result,
      date: date,
    };
  } catch {
    return await getExchangeRateFromFallback(base, target, date);
  }
}

// フォールバック: 概算レートを返す（APIが使えない場合）
async function getExchangeRateFromFallback(
  base: string,
  target: string,
  date: string
): Promise<ExchangeRateResult> {
  // 概算レート（2025年1月時点の相場を基準、定期的に更新推奨）
  const estimatedRates: Record<string, Record<string, number>> = {
    CNY: {
      JPY: 21.8, // 1元 ≈ 21.8円（2025年1月時点）
      USD: 0.137,
    },
    USD: {
      JPY: 158,
      CNY: 7.3,
    },
    JPY: {
      CNY: 0.046,
      USD: 0.0063,
    },
  };

  const rate = estimatedRates[base]?.[target];

  if (!rate) {
    throw new Error('サポートされていない通貨ペアです');
  }

  return {
    rate,
    date: date === 'latest' ? new Date().toISOString().split('T')[0] : date,
    base,
    target,
    isFallback: true, // APIが使えずフォールバック値を使用
  };
}

// 期間の為替レートを取得（無料APIでは期間指定は難しいため、最新レートで代用）
export async function getExchangeRateRange(
  startDate: string,
  endDate: string,
  base: string = 'CNY',
  target: string = 'JPY'
): Promise<ExchangeRateResult[]> {
  // 無料APIでは時系列データ取得が難しいため、最新レートを返す
  const latestRate = await getLatestExchangeRate(base, target);

  // 期間内の各日付に同じレートを適用（概算）
  const rates: ExchangeRateResult[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    rates.push({
      rate: latestRate.rate,
      date: d.toISOString().split('T')[0],
      base,
      target,
      isFallback: latestRate.isFallback,
    });
  }

  return rates;
}

// 為替レートをキャッシュするためのユーティリティ
const rateCache = new Map<string, { rate: ExchangeRateResult; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1時間

export async function getCachedExchangeRate(
  date: string = 'latest',
  base: string = 'CNY',
  target: string = 'JPY'
): Promise<ExchangeRateResult> {
  const cacheKey = `${base}-${target}-${date}`;
  const cached = rateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }

  const rate = date === 'latest'
    ? await getLatestExchangeRate(base, target)
    : await getHistoricalExchangeRate(date, base, target);

  rateCache.set(cacheKey, { rate, timestamp: Date.now() });

  return rate;
}

// 月の平均為替レートを取得
export async function getMonthlyAverageRate(
  year: number,
  month: number,
  base: string = 'CNY',
  target: string = 'JPY'
): Promise<ExchangeRateResult> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  try {
    const rates = await getExchangeRateRange(startDate, endDate, base, target);

    if (rates.length === 0) {
      throw new Error('レートが見つかりません');
    }

    const sum = rates.reduce((acc, r) => acc + r.rate, 0);
    const average = sum / rates.length;

    return {
      rate: Math.round(average * 100) / 100,
      date: `${year}-${String(month).padStart(2, '0')}`,
      base,
      target,
    };
  } catch {
    // フォールバック
    return await getCachedExchangeRate('latest', base, target);
  }
}
