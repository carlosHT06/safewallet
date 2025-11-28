import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = 'https://nzeummhwvmeepchjfjtw.supabase.co';
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZXVtbWh3dm1lZXBjaGpmanR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTc0OTUsImV4cCI6MjA3OTg3MzQ5NX0.zg52KBYWcu-K5qgBTa3EsiglbRau_UH4VthBS46Wm7U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------- Types -------------------- */
export interface SupabaseExpense {
  id: string;
  title?: string | null;
  category?: string | null;
  amount?: number | null;
  owner_id?: string | null;
  created_at?: string | null;
}

/* ------------------ Expenses: fetch ------------------ */
export async function fetchExpenses(): Promise<SupabaseExpense[]> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as SupabaseExpense[];
  } catch (err) {
    console.error('[supabase][fetchExpenses] error', err);
    throw err;
  }
}

/* --------------- Expenses: insert (RPC + fallback) --------------- */
export async function insertExpense({
  title,
  category,
  amount,
}: {
  title: string;
  category: string;
  amount: number;
}): Promise<SupabaseExpense | null> {
  try {
    // comprobar sesión / usuario
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) throw new Error('Usuario no autenticado. Inicia sesión antes de crear gastos.');

    // 1) intentar RPC (recomendado, usa auth.uid() en el server)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('rpc_insert_expense', { p_title: title, p_category: category, p_amount: amount } as any)
        .maybeSingle();

      if (rpcError) {
        console.warn('[insertExpense] rpc_insert_expense returned error:', rpcError);
      } else if (rpcData) {
        console.log('[insertExpense] created via RPC:', rpcData);
        return rpcData as SupabaseExpense;
      }
    } catch (rpcEx) {
      console.warn('[insertExpense] RPC exception:', rpcEx);
      // seguir a fallback
    }

    // 2) Fallback: insert directo (asegúrate owner_id = user.id)
    const payload: any = {
      title,
      amount,
      owner_id: user.id,
    };
    // incluye category sólo si viene
    if (category !== undefined && category !== null && String(category).trim() !== '') {
      payload.category = category;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[insertExpense] insert error:', error);
      throw error;
    }

    console.log('[insertExpense] created via direct insert:', data);
    return data as SupabaseExpense;
  } catch (err) {
    console.error('[insertExpense] final error:', err);
    throw err;
  }
}

/* ------------------ Expenses: update ------------------ */
export async function updateExpense({
  id,
  title,
  category,
  amount,
}: {
  id: string;
  title: string;
  category?: string;
  amount: number;
}): Promise<SupabaseExpense | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) throw new Error('Usuario no autenticado.');

    const updatePayload: any = { title, amount };
    if (category !== undefined) updatePayload.category = category;

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[updateExpense] error', error);
      throw error;
    }

    console.log('[updateExpense] updated', data);
    return data as SupabaseExpense | null;
  } catch (err) {
    console.error('[updateExpense] exception', err);
    throw err;
  }
}

/* ------------------ Expenses: delete ------------------ */
export async function deleteExpenseById(id: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) throw new Error('Usuario no autenticado.');

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      console.error('[deleteExpenseById] error', error);
      throw error;
    }
    console.log('[deleteExpenseById] deleted', id);
    return true;
  } catch (err) {
    console.error('[deleteExpenseById] exception', err);
    throw err;
  }
}

/* ------------------ Auth: signOut ------------------ */
export async function signOutUser(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[supabase][signOutUser] error', error);
      throw error;
    }
    console.log('[supabase][signOutUser] success');
    return true;
  } catch (err) {
    console.error('[supabase][signOutUser] exception', err);
    throw err;
  }
}

/* ------------------ Users: helper ------------------ */
/**
 * Busca un usuario por email en la tabla public.users.
 * Retorna la fila o null si no existe.
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[getUserByEmail] error:', error);
      throw error;
    }

    return data ?? null;
  } catch (err) {
    console.error('[getUserByEmail] exception:', err);
    return null;
  }
}
