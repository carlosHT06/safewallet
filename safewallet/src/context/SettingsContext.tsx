import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../themes/themes';
import { getRate, clearExchangeCache } from '../services/exchangeService'; 

type ThemeType = "light" | "dark";
type LangType = "es" | "en";
type CurrencyType = "HNL" | "USD";

export type SettingsValue = {
  theme: ThemeType;
  setTheme: (t: ThemeType) => Promise<void>;
  lang: LangType;
  setLang: (l: LangType) => Promise<void>;
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => Promise<void>;
  loading: boolean;
  activeTheme: typeof LightTheme | typeof DarkTheme;
  refreshExchangeRate: () => Promise<void>;
  clearExchangeCache: () => Promise<void>;
};

const THEME_KEY = "@settings_theme";
const LANG_KEY = "@settings_lang";
const CURRENCY_KEY = "@settings_currency";

const SettingsContext = createContext<SettingsValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>("light");
  const [lang, setLangState] = useState<LangType>("es");
  const [currency, setCurrencyState] = useState<CurrencyType>("HNL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(THEME_KEY);
        const l = await AsyncStorage.getItem(LANG_KEY);
        const c = await AsyncStorage.getItem(CURRENCY_KEY);

        if (t === "dark" || t === "light") setThemeState(t);
        if (l === "es" || l === "en") setLangState(l);
        if (c === "HNL" || c === "USD") setCurrencyState(c);
      } catch (e) {
        console.warn("[SettingsProvider] load prefs", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn("[SettingsProvider] persist error", key, e);
    }
  };

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    await persist(THEME_KEY, t);
  };

  const setLang = async (l: LangType) => {
    setLangState(l);
    await persist(LANG_KEY, l);
  };

  const setCurrency = async (c: CurrencyType) => {
    setCurrencyState(c);
    await persist(CURRENCY_KEY, c);

    try {
      // precache: HNL base -> c
      await getRate("HNL", c);
    } catch (e) {
      console.warn("[SettingsProvider] could not prefetch HNL->" + c, e);
    }
  };

  const refreshExchangeRate = async () => {
    try {
      await clearExchangeCache();
      await getRate("HNL", currency);
    } catch (e) {
      console.warn("[SettingsProvider] refreshExchangeRate", e);
      throw e;
    }
  };

  const clearExchangeCacheWrapped = async () => {
    try {
      await clearExchangeCache();
    } catch (e) {
      console.warn("[SettingsProvider] clearExchangeCache", e);
    }
  };

  const activeTheme = theme === "dark" ? DarkTheme : LightTheme;

  const value: SettingsValue = {
    theme,
    setTheme,
    lang,
    setLang,
    currency,
    setCurrency,
    loading,
    activeTheme,
    refreshExchangeRate,
    clearExchangeCache: clearExchangeCacheWrapped,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
