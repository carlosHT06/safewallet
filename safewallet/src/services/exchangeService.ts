import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@exchange_rate_';
const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hora

export type RateCache = {
  base: string;
  target: string;
  rate: number;
  fetchedAt: string; // ISO
};

function cacheKey(base: string, target: string) {
  return `${CACHE_PREFIX}${base}_${target}`.toUpperCase();
}

export async function getRate(
  base = 'USD',
  target = 'HNL',
  opts?: { ttlMs?: number }
): Promise<number> {
  const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const key = cacheKey(base, target);

  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed: RateCache = JSON.parse(raw);
      const age = Date.now() - new Date(parsed.fetchedAt).getTime();
      if (age < ttl && typeof parsed.rate === 'number') {
        return parsed.rate;
      }
    }
  } catch (e) {
  }

  try {
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(target)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Exchange API HTTP ${res.status}`);
    }
    const json = await res.json();
    const rate = json?.rates?.[target];
    if (typeof rate !== 'number') throw new Error('Invalid response from exchange API');

    const payload: RateCache = {
      base,
      target,
      rate,
      fetchedAt: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
    }

    return rate;
  } catch (err) {
    try {
      const oldRaw = await AsyncStorage.getItem(key);
      if (oldRaw) {
        const parsed: RateCache = JSON.parse(oldRaw);
        if (typeof parsed.rate === 'number') return parsed.rate;
      }
    } catch (_) { /* ignore */ }

    throw err;
  }
}

export async function clearExchangeCache(base?: string, target?: string) {
  if (base && target) {
    const key = cacheKey(base, target);
    await AsyncStorage.removeItem(key);
    return;
  }

  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(k => !!k && k.startsWith(CACHE_PREFIX));
    if (keysToRemove.length) await AsyncStorage.multiRemove(keysToRemove);
  } catch (e) {
   
    throw e;
  }
}
