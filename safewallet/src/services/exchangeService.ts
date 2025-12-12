import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@rate_cache_';
const CACHE_TTL_MS = 1000 * 60 * 60;
const FETCH_TIMEOUT = 8000;
const RETRIES = 2;

const EXCHANGERATE_HOST_KEY =
  process.env.EXCHANGE_RATE_HOST_KEY ??
  process.env.EXCHANGE_RATE_HOST_ACCESS_KEY ??
  null;

function timeoutFetch(url: string, opts: RequestInit = {}, ms = FETCH_TIMEOUT): Promise<Response> {
  return Promise.race([
    fetch(url, opts),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]) as Promise<Response>;
}

async function readCache(key: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.timestamp) return null;
    if (Date.now() - obj.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return obj.rate as number;
  } catch {
    return null;
  }
}

async function writeCache(key: string, rate: number) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ rate, timestamp: Date.now() }));
  } catch {}
}

async function tryFetchWithRetries(fn: () => Promise<number>, retries = RETRIES) {
  let lastErr = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, 200 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function getRate(from: string, to: string): Promise<number> {
  const fromU = String(from ?? '').toUpperCase();
  const toU = String(to ?? '').toUpperCase();
  if (!fromU || !toU) throw new Error('Invalid currency codes');
  if (fromU === toU) return 1;

  const cacheKey = `${CACHE_PREFIX}${fromU}_${toU}`;
  const cached = await readCache(cacheKey);
  if (cached !== null) return cached;

  const tryExchangerateHost = async (): Promise<number> => {
    if (!EXCHANGERATE_HOST_KEY) throw new Error('no_key');
    const url =
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(fromU)}` +
      `&to=${encodeURIComponent(toU)}&amount=1&access_key=${encodeURIComponent(EXCHANGERATE_HOST_KEY)}`;
    const res = await timeoutFetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }
    const json: any = await res.json().catch(async () => {
      const txt = await res.text().catch(() => '');
      throw new Error(txt);
    });
    const rate =
      typeof json.result === 'number'
        ? Number(json.result)
        : json?.info?.rate
        ? Number(json.info.rate)
        : NaN;
    if (!Number.isFinite(rate) || rate <= 0) throw new Error(JSON.stringify(json));
    await writeCache(cacheKey, rate);
    return rate;
  };

  const tryOpenER = async (): Promise<number> => {
    const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(fromU)}`;
    const res = await timeoutFetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }
    const json: any = await res.json().catch(async () => {
      const txt = await res.text().catch(() => '');
      throw new Error(txt);
    });
    const rate = json?.rates?.[toU];
    if (!Number.isFinite(rate) || rate <= 0) throw new Error(JSON.stringify(json));
    await writeCache(cacheKey, rate);
    return rate;
  };

  const tryFrankfurter = async (): Promise<number> => {
    const url =
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(fromU)}` +
      `&to=${encodeURIComponent(toU)}`;
    const res = await timeoutFetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} - ${txt}`);
    }
    const json: any = await res.json().catch(async () => {
      const txt = await res.text().catch(() => '');
      throw new Error(txt);
    });
    const rate = json?.rates?.[toU];
    if (!Number.isFinite(rate) || rate <= 0) throw new Error(JSON.stringify(json));
    await writeCache(cacheKey, rate);
    return rate;
  };

  if (EXCHANGERATE_HOST_KEY) {
    try {
      return await tryFetchWithRetries(tryExchangerateHost, 1);
    } catch {}
  }

  try {
    return await tryFetchWithRetries(tryOpenER, 1);
  } catch {}

  try {
    return await tryFetchWithRetries(tryFrankfurter, 0);
  } catch {}

  throw new Error('Invalid response from exchange API');
}
