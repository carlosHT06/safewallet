
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase, fetchExpenses, insertExpense, updateExpense, deleteExpenseById, isUuid } from '../services/supabase';


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
  refresh: () => Promise<void>;
  updateExpenseLocalThenRemote: (payload: { id: string; title?: string; amount?: number; category?: string }) => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { profile, sessionUser } = useAuth?.() ?? { profile: null, sessionUser: null };

  const EXPENSES_KEY = '@expenses';
  const BUDGET_KEY = '@budget';

  const saveExpensesToStorage = async (list: Expense[]) => {
    try {
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[ExpensesContext] saveExpensesToStorage', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(EXPENSES_KEY);
        const parsed = raw ? (JSON.parse(raw) as Expense[]) : [];
        if (mounted) setExpenses(parsed || []);
      } catch (e) {
        console.warn('[ExpensesContext] load expenses', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    (async () => {
      try {
        if (!profile) return;
        const raw = profile.budget;
        if (typeof raw !== 'undefined' && raw !== null) {
          const val = Number(String(raw).replace(/[^0-9.-]+/g, ''));
          if (!Number.isNaN(val)) {
            await setBudget(val);
          }
        }
      } catch (e) {
        console.warn('[ExpensesContext] sync profile budget error', e);
      }
    })();
  }, [profile]);

  const totalExpenses = useMemo(() => expenses.reduce((s, it) => s + Number(it.amount || 0), 0), [expenses]);
  const remainingBudget = useMemo(() => (budget === null ? null : budget - totalExpenses), [budget, totalExpenses]);

  const saveBudgetToStorage = async (value: number | null) => {
    try {
      if (value === null) await AsyncStorage.removeItem(BUDGET_KEY);
      else await AsyncStorage.setItem(BUDGET_KEY, String(value));
    } catch (e) {
      console.warn('[ExpensesContext] saveBudgetToStorage', e);
    }
  };

  const setBudget = async (value: number) => {
    setBudgetState(value);
    await saveBudgetToStorage(value);
  };

  
  const refresh = async () => {
    setLoading(true);
    try {
      const userId = sessionUser?.id ?? profile?.id ?? null;
      if (!userId) {
        setLoading(false);
        return;
      }

      const data = await fetchExpenses(userId);
      const rows = data.map((r: any) => ({
        id: String(r.id),
        title: r.title ?? '',
        amount: Number(r.amount ?? 0),
        date: r.date ?? r.created_at,
        category: r.category ?? 'General',
        ...r,
      }));
      setExpenses(rows);
      await saveExpensesToStorage(rows);
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
    };

    const next = [newExpense, ...expenses];
    setExpenses(next);
    await saveExpensesToStorage(next);

    
    try {
      const resp = await insertExpense({
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
      });
      if (resp && (resp as any).id) {
        const createdId = String((resp as any).id);
        const replaced = next.map((e) => (e.id === tempId ? { ...e, id: createdId } : e));
        setExpenses(replaced);
        await saveExpensesToStorage(replaced);
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
    await saveExpensesToStorage(next);

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
    await saveExpensesToStorage(next);

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
      if (remote) {
        const userId = sessionUser?.id ?? profile?.id ?? null;
        if (userId) {
          
          await supabase.from('expenses').delete().eq('owner_id', userId);
        }
      }
      setExpenses([]);
      await AsyncStorage.removeItem(EXPENSES_KEY);
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
    updateExpenseLocalThenRemote,
  };

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};
