// src/screens/AddExpenseScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useExpenses } from '../context/ExpensesContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types/navigation';
import { SupabaseExpense, updateExpense } from '../services/supabase'; // asegurarse export

type NavProp = BottomTabNavigationProp<TabParamList, 'AddExpense'>;

export default function AddExpenseScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute();
  const { addExpense, refresh } = useExpenses();

  // route.params may be undefined or have { edit: true, expenseId }
  const params: any = (route.params ?? {}) as { edit?: boolean; expenseId?: string };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // If editing, prefill fields from context (find by id)
  useEffect(() => {
    try {
      if (params?.edit && params.expenseId) {
        setIsEdit(true);
        setEditingId(params.expenseId);
        // try load expense from context
        // the context stores a list of expenses; import it
        // to avoid circular dependency, we call refresh & fetch rows then find
        (async () => {
          await refresh();
          // we can read from the context using useExpenses, but here we call refresh and then rely on context state
          // instead, get the expense via fetchExpenses or from context:
        })();
      }
    } catch (e) {
      console.warn('prefill edit error', e);
    }
  }, [params]);

  // Better: try to get expense from Context (if present)
  // We'll access context's expenses via useExpenses (already used above)
  // but we only have addExpense & refresh from the hook. So get expenses by calling refresh then reading global store:
  // (Simpler approach — attempt to fetch single row via supabase)
  useEffect(() => {
    (async () => {
      if (params?.edit && params.expenseId) {
        try {
          // fetch single expense row
          const { data, error } = await (await import('../services/supabase')).supabase
            .from('expenses')
            .select('*')
            .eq('id', params.expenseId)
            .maybeSingle();

          if (error) {
            console.warn('get single expense error', error);
          } else if (data) {
            setTitle(String(data.title ?? ''));
            setCategory(String(data.category ?? ''));
            setAmount(String(data.amount ?? ''));
          }
        } catch (err) {
          console.warn('prefill fetch exception', err);
        }
      }
    })();
  }, [params]);

  const onSave = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Ingrese un título');
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Error', 'Ingrese un monto válido');

    setSaving(true);
    try {
      if (params?.edit && editingId) {
        // update via service
        await updateExpense({ id: editingId, title: title.trim(), category: category.trim() || 'General', amount: amt });
        await refresh();
        Alert.alert('Listo', 'Gasto actualizado');
        navigation.navigate('Home');
        return;
      }

      // create new
      await addExpense({ title: title.trim(), category: category.trim() || 'General', amount: amt });
      Alert.alert('Listo', 'Gasto guardado');
      navigation.navigate('Home');
    } catch (err: any) {
      console.error('AddExpense error:', err);
      Alert.alert('Error', err?.message ?? 'No se pudo guardar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>{params?.edit ? 'Editar gasto' : 'Nuevo gasto'}</Text>

        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ej: Almuerzo" />

        <Text style={styles.label}>Categoría</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Ej: Comida" />

        <Text style={styles.label}>Monto</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <TouchableOpacity style={[styles.button, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : params?.edit ? 'Actualizar' : 'Guardar gasto'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 6, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
