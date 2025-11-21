import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

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

const INITIAL_EXPENSES: Expense[] = [
  { id: '1', title: 'Almuerzo', category: 'Comida', amount: 150, date: '2025-11-20' },
  { id: '2', title: 'Bus', category: 'Transporte', amount: 25, date: '2025-11-20' },
];

export const ExpensesProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  const addExpense: ExpensesContextValue['addExpense'] = ({
    title,
    category,
    amount,
  }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      title,
      category,
      amount,
      date: new Date().toISOString().split('T')[0], // fecha de hoy
    };

    setExpenses((prev) => [newExpense, ...prev]);
  };

  const removeExpense: ExpensesContextValue['removeExpense'] = (id) => {
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
  if (!ctx) {
    throw new Error('useExpenses debe usarse dentro de ExpensesProvider');
  }
  return ctx;
};
