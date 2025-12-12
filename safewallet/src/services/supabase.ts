import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://nzeummhwvmeepchjfjtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZXVtbWh3dm1lZXBjaGpmanR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTc0OTUsImV4cCI6MjA3OTg3MzQ5NX0.zg52KBYWcu-K5qgBTa3EsiglbRau_UH4VthBS46Wm7U';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------- Types -------------------- */
export interface SupabaseExpense {
  id: string;
  title?: string | null;
  category?: string | null;
  amount?: number | null;
  owner_id?: string | null;
  created_at?: string | null;
}

async function handleResponse<T>(res: { data: T | null; error: any }) {
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

export function isUuid(v: string | null | undefined): boolean {
  if (!v || typeof v !== 'string') return false;
  const re = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return re.test(v);
}

export async function getCurrentUserId(): Promise<string> {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[supabase][getCurrentUserId] auth error', error);
    throw error;
  }
  const user = userData?.user ?? null;
  if (!user?.id) throw new Error('Usuario no autenticado.');
  return user.id;
}

export async function fetchExpenses(ownerId?: string): Promise<SupabaseExpense[]> {
  try {
    const query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (ownerId) query.eq('owner_id', ownerId);

    const res = await query;
    const data = await handleResponse<any[]>(res);
    return (data ?? []) as SupabaseExpense[];
  } catch (err) {
    console.error('[supabase][fetchExpenses] error', err);
    throw err;
  }
}

/* --------------- Expenses: insert (RPC + fallback) --------------- */
export async function insertExpense(params: {
  title: string;
  category?: string | null;
  amount: number;
}): Promise<SupabaseExpense> {
  const { title, category, amount } = params;

  if (!title || typeof title !== 'string') throw new Error('Título inválido.');
  if (typeof amount !== 'number' || Number.isNaN(amount)) throw new Error('Monto inválido.');

  try {
    const userId = await getCurrentUserId();

    try {
      const rpcRes = await supabase
        .rpc('rpc_insert_expense', { p_title: title, p_category: category ?? null, p_amount: amount } as any)
        .maybeSingle();
      const rpcData = await handleResponse<any>(rpcRes);
      if (rpcData) return rpcData as SupabaseExpense;
    } catch (rpcErr) {
      console.warn('[insertExpense] RPC failed, falling back to direct insert', rpcErr);
    }

    const payload: any = {
      title: title.trim(),
      amount,
      owner_id: userId,
    };
    if (category && String(category).trim() !== '') payload.category = String(category).trim();

    const insertRes = await supabase.from('expenses').insert(payload).select().maybeSingle();
    const inserted = await handleResponse<any>(insertRes);
    if (!inserted) throw new Error('No se creó el gasto.');
    return inserted as SupabaseExpense;
  } catch (err) {
    console.error('[supabase][insertExpense] error', err);
    throw err;
  }
}

/* ------------------ Expenses: update ------------------ */
export async function updateExpense(params: {
  id: string;
  title?: string;
  category?: string | null;
  amount?: number;
}): Promise<SupabaseExpense | null> {
  const { id, title, category, amount } = params;
  if (!id) throw new Error('ID inválido.');

  if (!isUuid(id)) {
    throw new Error('ID inválido para actualización remota (no es UUID).');
  }

  try {
    const userId = await getCurrentUserId();
    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = String(title).trim();
    if (category !== undefined) updatePayload.category = category;
    if (amount !== undefined) {
      if (typeof amount !== 'number' || Number.isNaN(amount)) throw new Error('Monto inválido.');
      updatePayload.amount = amount;
    }

    const res = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .maybeSingle();

    return (await handleResponse<any>(res)) as SupabaseExpense | null;
  } catch (err) {
    console.error('[supabase][updateExpense] error', err);
    throw err;
  }
}

/* ------------------ Expenses: delete ------------------ */
export async function deleteExpenseById(id: string): Promise<boolean> {
  if (!id) throw new Error('ID inválido.');

  if (!isUuid(id)) {
    throw new Error('ID inválido para eliminación remota (no es UUID).');
  }

  try {
    const userId = await getCurrentUserId();
    const res = await supabase.from('expenses').delete().eq('id', id).eq('owner_id', userId);
    await handleResponse<any>(res);
    return true;
  } catch (err) {
    console.error('[supabase][deleteExpenseById] error', err);
    throw err;
  }
}

/* ------------------ Auth: signOut ------------------ */
export async function signOutUser(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    try { await AsyncStorage.removeItem('@user_profile'); } catch (_) {}
    return true;
  } catch (err) {
    console.error('[supabase][signOutUser] error', err);
    throw err;
  }
}

/* ------------------ Users: helpers ------------------ */
export async function getUserByEmail(email: string) {
  if (!email) return null;
  try {
    const res = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    return await handleResponse<any>(res);
  } catch (err) {
    console.error('[getUserByEmail] error', err);
    return null;
  }
}

export async function getUserById(id: string) {
  if (!id) return null;
  try {
    const res = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return await handleResponse<any>(res);
  } catch (err) {
    console.error('[getUserById] error', err);
    return null;
  }
}

export async function saveProfileToStorage(profile: any) {
  try {
    await AsyncStorage.setItem('@user_profile', JSON.stringify(profile ?? {}));
  } catch (e) {
    console.warn('[saveProfileToStorage] error', e);
  }
}
export async function loadProfileFromStorage() {
  try {
    const raw = await AsyncStorage.getItem('@user_profile');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[loadProfileFromStorage] error', e);
    return null;
  }
}

/* ------------------ Budget helpers ------------------ */
export async function getUserBudget(userId: string) {
  if (!userId) return 0;
  try {
    const res = await supabase.from('users').select('budget').eq('id', userId).maybeSingle();
    const data = await handleResponse<any>(res);
    return Number(data?.budget ?? 0);
  } catch (err) {
    console.error('[getUserBudget] error', err);
    return 0;
  }
}

export async function updateUserBudget(userId: string, budget: number) {
  if (!userId) throw new Error('userId requerido');
  if (typeof budget !== 'number' || Number.isNaN(budget)) throw new Error('budget inválido');
  try {
    const res = await supabase.from('users').update({ budget }).eq('id', userId).select().maybeSingle();
    return await handleResponse<any>(res);
  } catch (err) {
    console.error('[updateUserBudget] error', err);
    throw err;
  }
}

/* ------------------ Sum expenses ------------------ */
function monthRangeIso(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function sumExpensesForUser(userId: string, options?: { from?: string; to?: string }) {
  if (!userId) return 0;
  try {
    const range = (options && options.from && options.to)
      ? { start: options.from, end: options.to }
      : monthRangeIso();
    const { start, end } = range;

    const res = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);

    const data = await handleResponse<any[]>(res);
    const total = (data ?? []).reduce((acc: number, r: any) => acc + Number(r.amount ?? 0), 0);
    return total;
  } catch (err) {
    console.error('[sumExpensesForUser] error', err);
    return 0;
  }
}
