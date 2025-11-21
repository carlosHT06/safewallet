import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

interface ExpensesContextValue {
  expenses: Expense[];
  addExpense: (data: { title: string; category: string; amount: number }) => void;
  removeExpense: (id: string) => void;
}

const ExpensesContext = createContext<ExpensesContextValue | undefined>(undefined);

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', title: 'Almuerzo', category: 'Comida', amount: 150, date: '2025-11-20' },
    { id: '2', title: 'Bus', category: 'Transporte', amount: 25, date: '2025-11-20' },
  ]);

  const addExpense = (data: { title: string; category: string; amount: number }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      title: data.title,
      category: data.category,
      amount: data.amount,
      date: new Date().toISOString().slice(0, 10),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, removeExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses debe usarse dentro de ExpensesProvider");
  return ctx;
};
