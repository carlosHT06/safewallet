import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface ExpensesState {
  list: Expense[];
}

const initialState: ExpensesState = {
  list: [
    { id: '1', title: 'Almuerzo', category: 'Comida', amount: 150, date: '2025-11-20' },
    { id: '2', title: 'Bus', category: 'Transporte', amount: 25, date: '2025-11-20' },
  ],
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (
      state,
      action: PayloadAction<{ title: string; category: string; amount: number }>
    ) => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        title: action.payload.title,
        category: action.payload.category,
        amount: action.payload.amount,
        date: new Date().toISOString().slice(0, 10),
      };
      state.list.unshift(newExpense); // agrega al inicio
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((exp) => exp.id !== action.payload);
    },
  },
});

export const { addExpense, removeExpense } = expensesSlice.actions;
export default expensesSlice.reducer;
