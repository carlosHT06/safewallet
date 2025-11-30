import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  budget: number | null;
  setBudget: (b: number | null) => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [budget, setBudgetState] = useState<number | null>(null);

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

  // cargar presupuesto desde AsyncStorage al iniciar
  const loadBudget = async () => {
    try {
      const raw = await AsyncStorage.getItem('@budget');
      if (raw !== null) {
        // limpiar posibles símbolos y comas por seguridad
        const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
        setBudgetState(cleaned ? Number(cleaned) : null);
      }
    } catch (err) {
      console.error('[ExpensesContext][loadBudget] error', err);
    }
  };

  useEffect(() => {
    load();
    loadBudget();
  }, []);

  const setBudget = async (b: number | null) => {
    setBudgetState(b);
    try {
      if (b === null) {
        await AsyncStorage.removeItem('@budget');
      } else {
        await AsyncStorage.setItem('@budget', String(b));
      }
    } catch (err) {
      console.error('[ExpensesContext][setBudget] error', err);
    }
  };

  const parseBudgetToNumber = (raw: any): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return raw;
    const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
    const n = cleaned ? Number(cleaned) : NaN;
    return isNaN(n) ? null : n;
  };

  const addExpense = async (data: { title: string; category: string; amount: number }) => {
    try {
      console.log('[ExpensesContext] addExpense called', { data, budget });

      // defensive: parse budget to number even if it's stored weirdly
      const numericBudget = parseBudgetToNumber(budget);

      // fetch latest expenses from server to avoid race conditions (authoritative total)
      const latestRows = await fetchExpenses();
      const latestSum = latestRows.reduce((s: number, r: SupabaseExpense) => s + Number(r.amount ?? 0), 0);

      const amountNum = Number(data.amount ?? 0);

      if (numericBudget !== null) {
        if ((latestSum + amountNum) > numericBudget) {
          const restante = numericBudget - latestSum;
          Alert.alert(
            'Presupuesto excedido',
            `No se puede registrar este gasto porque excede tu presupuesto.\n\nPresupuesto: L ${numericBudget}\nGastado: L ${latestSum}\nDisponible: L ${restante >= 0 ? restante : 0}`
          );
          console.warn('[ExpensesContext] addExpense blocked by budget', { numericBudget, latestSum, amountNum });
          return; // detener el guardado
        }
      }

      // Si pasa la validación, insertar en Supabase
      const created = await insertExpense(data);
      if (created) {
        setExpenses((prev) => [mapRowToExpense(created as SupabaseExpense), ...prev]);
      } else {
        // fallback: recargar lista completa
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
    <ExpensesContext.Provider
      value={{
        expenses,
        loading,
        addExpense,
        removeExpense,
        refresh: load,
        budget,
        setBudget,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses debe usarse dentro de ExpensesProvider');
  return ctx;
};
