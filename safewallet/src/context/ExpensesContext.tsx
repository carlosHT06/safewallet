import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

// Types
export type Expense = {
  id: string;
  title: string;
  amount: number;
  date?: string;
  category?: string;
  [key: string]: any;
};

export type ExpensesContextValue = {
  expenses: Expense[];
  totalExpenses: number;
  budget: number | null;
  remainingBudget: number | null;
  loading: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  setBudget: (value: number) => Promise<void>;
  clearAllExpenses: (remote?: boolean) => Promise<void>;
  refresh: () => Promise<void>; // <-- added refresh
};

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { profile, sessionUser } = useAuth?.() ?? { profile: null, sessionUser: null };

  // Keys for AsyncStorage (adjust if your project uses different keys)
  const EXPENSES_KEY = '@expenses';
  const BUDGET_KEY = '@budget';

  // Helper: save expenses locally
  const saveExpensesToStorage = async (list: Expense[]) => {
    try {
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[ExpensesContext] saveExpensesToStorage', e);
    }
  };

  // Load from storage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawExpenses = await AsyncStorage.getItem(EXPENSES_KEY);
        const parsedExpenses = rawExpenses ? (JSON.parse(rawExpenses) as Expense[]) : [];
        if (mounted) setExpenses(parsedExpenses || []);
      } catch (e) {
        console.warn('[ExpensesContext] load expenses', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // load budget from AsyncStorage on start
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BUDGET_KEY);
        if (raw !== null && mounted) {
          const n = Number(raw);
          if (!Number.isNaN(n)) setBudgetState(n);
        }
      } catch (e) {
        console.warn('[ExpensesContext] load budget', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Sync budget from profile (AuthContext) when it changes
  useEffect(() => {
    (async () => {
      try {
        if (!profile) return;
        const raw = profile.budget;
        if (typeof raw !== 'undefined' && raw !== null) {
          const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
          const val = cleaned ? Number(cleaned) : null;
          if (val !== null && !Number.isNaN(val)) {
            await setBudget(val);
          }
        }
      } catch (e) {
        console.warn('[ExpensesContext] sync profile budget error', e);
      }
    })();
  }, [profile]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((s, it) => s + Number(it.amount || 0), 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => {
    if (budget === null) return null;
    return budget - totalExpenses;
  }, [budget, totalExpenses]);

  const saveBudgetToStorage = async (value: number | null) => {
    try {
      if (value === null) {
        await AsyncStorage.removeItem(BUDGET_KEY);
      } else {
        await AsyncStorage.setItem(BUDGET_KEY, String(value));
      }
    } catch (e) {
      console.warn('[ExpensesContext] saveBudgetToStorage', e);
    }
  };

  // Set budget (state + persist)
  const setBudget = async (value: number) => {
    setBudgetState(value);
    await saveBudgetToStorage(value);
  };

  // Refresh expenses from remote (Supabase) and update local state
  const refresh = async () => {
    setLoading(true);
    try {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      if (!userId) {
        // nothing to fetch
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.warn('[ExpensesContext] refresh error', error);
      } else if (Array.isArray(data)) {
        // normalize returned rows to Expense[] (ensure required fields)
        const rows = data.map((r: any) => ({
          id: String(r.id ?? `${Date.now()}-${Math.random()}`),
          title: r.title ?? '',
          amount: Number(r.amount ?? 0),
          date: r.date ?? (r.created_at ?? new Date().toISOString()),
          category: r.category ?? 'General',
          ...r,
        }));
        setExpenses(rows);
        await saveExpensesToStorage(rows);
      }
    } catch (e) {
      console.error('[ExpensesContext] refresh unexpected', e);
    } finally {
      setLoading(false);
    }
  };

  // Add expense with validation against budget
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const amountNum = Number(expense.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }

    const numericBudget = budget;
    const latestSum = totalExpenses;

    if (numericBudget !== null && latestSum + amountNum > numericBudget) {
      Alert.alert('Presupuesto excedido', 'Este gasto excede el presupuesto disponible.');
      return;
    }

    const newExpense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: expense.title ?? '',
      amount: amountNum,
      date: expense.date ?? new Date().toISOString(),
      category: expense.category ?? 'General',
    };

    const next = [newExpense, ...expenses];
    setExpenses(next);
    await saveExpensesToStorage(next);

    // persist remote
    try {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      if (userId) {
        const { error } = await supabase.from('expenses').insert([{ ...newExpense, user_id: userId }]);
        if (error) console.warn('[ExpensesContext] remote insert error', error);
      }
    } catch (e) {
      console.warn('[ExpensesContext] save expense remote', e);
    }
  };

  const removeExpense = async (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    await saveExpensesToStorage(next);

    // delete remote if exists
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) console.warn('[ExpensesContext] remote delete error', error);
    } catch (err) {
      console.warn('[ExpensesContext] removeExpense remote', err);
    }
  };

  // Clear all expenses (local + remote optional)
  const clearAllExpenses = async (remote = true) => {
    try {
      if (remote) {
        try {
          const userId = sessionUser?.id ?? profile?.id ?? null;
          if (userId) {
            const { error } = await supabase.from('expenses').delete().eq('user_id', userId);
            if (error) console.warn('[ExpensesContext] remote delete all error', error);
          }
        } catch (err) {
          console.warn('[ExpensesContext] remote clearAllExpenses', err);
        }
      }

      setExpenses([]);
      await AsyncStorage.removeItem(EXPENSES_KEY);

      console.log('[ExpensesContext] clearAllExpenses: expenses cleared (remote:', remote, ')');
    } catch (e) {
      console.error('[ExpensesContext] clearAllExpenses error', e);
      throw e;
    }
  };

  const value: ExpensesContextValue = {
    expenses,
    totalExpenses,
    budget,
    remainingBudget,
    loading,
    addExpense,
    removeExpense,
    setBudget,
    clearAllExpenses,
    refresh,
  };

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};