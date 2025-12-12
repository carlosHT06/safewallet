import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import {
  supabase,
  fetchExpenses,
  insertExpense,
  updateExpense,
  deleteExpenseById,
  isUuid,
  updateUserBudget,
  getUserBudget,
} from '../services/supabase';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date?: string;
  category?: string;
  owner_id?: string | null;
  created_at?: string | null;
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
  refresh: () => Promise<void>;
  updateExpenseLocalThenRemote: (payload: { id: string; title?: string; amount?: number; category?: string }) => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { profile, sessionUser, refreshProfile } = useAuth();

  const STORAGE_KEY = (userId: string | null) => `@expenses_${userId ?? 'anon'}`;
  const BUDGET_KEY = (userId: string | null) => `@budget_${userId ?? 'anon'}`;

  const saveExpensesToStorage = async (userId: string | null, list: Expense[]) => {
    try {
      if (!userId) return;
      await AsyncStorage.setItem(STORAGE_KEY(userId), JSON.stringify(list));
    } catch (e) {
      console.warn('[ExpensesContext] saveExpensesToStorage', e);
    }
  };

  const loadExpensesFromStorage = async (userId: string | null) => {
    try {
      if (!userId) {
        setExpenses([]);
        return;
      }
      const raw = await AsyncStorage.getItem(STORAGE_KEY(userId));
      if (!raw) {
        setExpenses([]);
        return;
      }
      const parsed = JSON.parse(raw) as Expense[];
      setExpenses(parsed ?? []);
    } catch (e) {
      console.warn('[ExpensesContext] loadExpensesFromStorage', e);
      setExpenses([]);
    }
  };

  const saveBudgetToStorage = async (userId: string | null, value: number | null) => {
    try {
      if (!userId) return;
      if (value === null) await AsyncStorage.removeItem(BUDGET_KEY(userId));
      else await AsyncStorage.setItem(BUDGET_KEY(userId), String(value));
    } catch (e) {
      console.warn('[ExpensesContext] saveBudgetToStorage', e);
    }
  };

  const loadBudgetFromStorage = async (userId: string | null) => {
    try {
      if (!userId) {
        setBudgetState(null);
        return;
      }
      const raw = await AsyncStorage.getItem(BUDGET_KEY(userId));
      if (raw === null) {
        try {
          const b = await getUserBudget(userId);
          setBudgetState(Number(b ?? 0));
          await saveBudgetToStorage(userId, Number(b ?? 0));
        } catch {
          setBudgetState(null);
        }
        return;
      }
      const n = Number(raw);
      if (!Number.isNaN(n)) setBudgetState(n);
      else setBudgetState(null);
    } catch (e) {
      console.warn('[ExpensesContext] loadBudgetFromStorage', e);
      setBudgetState(null);
    }
  };

  const totalExpenses = useMemo(() => expenses.reduce((s, it) => s + Number(it.amount || 0), 0), [expenses]);
  const remainingBudget = useMemo(() => (budget === null ? null : budget - totalExpenses), [budget, totalExpenses]);

  const refresh = async () => {
    setLoading(true);
    try {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      if (!userId) {
        setExpenses([]);
        setLoading(false);
        return;
      }

      console.log('[ExpensesContext] refresh remote for user', userId);
      const remote = await fetchExpenses(userId);
      const rows = (remote ?? []).map((r: any) => ({
        id: String(r.id),
        title: r.title ?? '',
        amount: Number(r.amount ?? 0),
        date: r.created_at ?? r.date ?? new Date().toISOString(),
        category: r.category ?? 'General',
        owner_id: r.owner_id ?? r.owner ?? userId,
        created_at: r.created_at ?? null,
        ...r,
      })) as Expense[];

      setExpenses(rows);
      await saveExpensesToStorage(userId, rows);
    } catch (e) {
      console.error('[ExpensesContext] refresh error', e);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const amountNum = Number(expense.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Monto inválido');
      return;
    }
    if (budget !== null && totalExpenses + amountNum > budget) {
      Alert.alert('Presupuesto excedido', 'Este gasto excede el presupuesto disponible.');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newExpense: Expense = {
      id: tempId,
      title: expense.title ?? '',
      amount: amountNum,
      date: expense.date ?? new Date().toISOString(),
      category: expense.category ?? 'General',
      owner_id: sessionUser?.id ?? profile?.id ?? null,
      created_at: expense.created_at ?? null,
    };

    const next = [newExpense, ...expenses];
    setExpenses(next);
    await saveExpensesToStorage(sessionUser?.id ?? profile?.id ?? null, next);

    try {
      const resp = await insertExpense({
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
      });
      if (resp && (resp as any).id) {
        const createdId = String((resp as any).id);
        const replaced = next.map((e) => (e.id === tempId ? { ...e, id: createdId, owner_id: resp.owner_id ?? e.owner_id, created_at: resp.created_at ?? e.created_at } : e));
        setExpenses(replaced);
        await saveExpensesToStorage(sessionUser?.id ?? profile?.id ?? null, replaced);
      } else {
        await refresh();
      }
    } catch (e) {
      console.warn('[ExpensesContext] remote insert failed', e);
    }
  };

  const updateExpenseLocalThenRemote = async (payload: { id: string; title?: string; amount?: number; category?: string }) => {
    const next = expenses.map((e) => (e.id === payload.id ? { ...e, ...payload } : e));
    setExpenses(next);
    await saveExpensesToStorage(sessionUser?.id ?? profile?.id ?? null, next);

    if (isUuid(payload.id)) {
      try {
        await updateExpense(payload as any);
      } catch (err) {
        console.warn('[ExpensesContext] update remote error', err);
      }
    } else {
    }
  };

  const removeExpense = async (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    await saveExpensesToStorage(sessionUser?.id ?? profile?.id ?? null, next);

    if (isUuid(id)) {
      try {
        await deleteExpenseById(id);
      } catch (err) {
        console.warn('[ExpensesContext] remote delete error', err);
      }
    } else {
    }
  };

  const clearAllExpenses = async (remote = true) => {
    try {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      if (remote && userId) {
        try {
          await supabase.from('expenses').delete().eq('owner_id', userId);
        } catch (err) {
          console.warn('[ExpensesContext] remote clear single call failed', err);
        }
      }
      setExpenses([]);
      await AsyncStorage.removeItem(STORAGE_KEY(sessionUser?.id ?? profile?.id ?? null));
    } catch (e) {
      console.error('[ExpensesContext] clearAllExpenses error', e);
      throw e;
    }
  };

  const setBudget = async (value: number) => {
    try {
      setBudgetState(value);
      const userId = sessionUser?.id ?? profile?.id ?? null;
      await saveBudgetToStorage(userId, value);
      if (userId) {
        try {
          await updateUserBudget(userId, value);
        } catch (e) {
          console.warn('[ExpensesContext] updateUserBudget remote failed', e);
        }
        try {
          await refreshProfile?.();
        } catch {}
      }
    } catch (e) {
      console.warn('[ExpensesContext] setBudget error', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userId = sessionUser?.id ?? profile?.id ?? null;
        if (!mounted) return;
        await loadExpensesFromStorage(userId);
        await loadBudgetFromStorage(userId);
        await refresh();
      } catch (e) {
        console.warn('[ExpensesContext] init error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []); 

  useEffect(() => {
    (async () => {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      console.log('[ExpensesContext] auth user changed ->', userId);
      if (!userId) {
        setExpenses([]);
        setBudgetState(null);
        setLoading(false);
        return;
      }
      await loadExpensesFromStorage(userId);
      await loadBudgetFromStorage(userId);
      await refresh();
    })();
  }, [sessionUser?.id, profile?.id]);

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
    updateExpenseLocalThenRemote,
  };

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};
