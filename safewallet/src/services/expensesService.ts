import { supabase } from "./supabase.js";

export const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};

export const addExpenseDB = async (expense: {
  title: string;
  category: string;
  amount: number;
}) => {
  const newExpense = {
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert([newExpense])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExpenseDB = async (id: string) => {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

