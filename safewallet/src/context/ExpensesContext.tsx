// src/context/ExpensesContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { fetchExpenses, insertExpense, deleteExpenseById, SupabaseExpense } from '../services/supabase';

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

interface ExpensesContextValue {
  expenses: Expense[];
  loading: boolean;
  addExpense: (data: { title: string; category: string; amount: number }) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const mapRowToExpense = (r: SupabaseExpense): Expense => {
    const date =
      (r.created_at ? String(r.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10));
    return {
      id: String(r.id),
      title: String(r.title ?? 'Sin título'),
      category: String(r.category ?? 'General'),
      amount: Number(r.amount ?? 0),
      date,
    };
  };

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchExpenses();
      setExpenses(rows.map(mapRowToExpense));
    } catch (err) {
      console.error('[ExpensesContext][load] error', err);
      Alert.alert('Error', 'No se pudieron cargar los gastos. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addExpense = async (data: { title: string; category: string; amount: number }) => {
    try {
      const created = await insertExpense(data);
      if (created) {
        setExpenses((prev) => [mapRowToExpense(created as SupabaseExpense), ...prev]);
      } else {
        await load();
      }
    } catch (err) {
      console.error('[ExpensesContext][addExpense]', err);
      Alert.alert('Error', (err as any)?.message ?? 'No se pudo guardar el gasto.');
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await deleteExpenseById(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('[ExpensesContext][removeExpense]', err);
      Alert.alert('Error', (err as any)?.message ?? 'No se pudo eliminar el gasto.');
    }
  };

  return (
    <ExpensesContext.Provider value={{ expenses, loading, addExpense, removeExpense, refresh: load }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses debe usarse dentro de ExpensesProvider');
  return ctx;
};
