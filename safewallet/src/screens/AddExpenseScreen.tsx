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
  FlatList,
} from 'react-native';

import { useExpenses } from '../context/ExpensesContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types/navigation';
import { supabase, updateExpense } from '../services/supabase';
import { useSettings } from '../context/SettingsContext';

type NavProp = BottomTabNavigationProp<TabParamList, 'AddExpense'>;

const defaultCategories = [
  'Comida',
  'Transporte',
  'Supermercado',
  'Entretenimiento',
  'Salud',
  'Hogar',
  'Educación',
  'Trabajo',
  'Regalos',
  'Computadora',
  'Otra',
];

export default function AddExpenseScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute();
  const { addExpense, refresh, expenses, budget } = useExpenses();
  const { theme, lang } = useSettings();

  const params: any = (route.params ?? {}) as { edit?: boolean; expenseId?: string };

  // idioma (traducciones simples)
  const t = (es: string, en: string) => (lang === 'es' ? es : en);

  // tema dinámico
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#121212' : '#fff',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#fff' : '#000',
    subtle: isDark ? '#bbb' : '#666',
    border: isDark ? '#333' : '#ddd',
  };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [queryCategory, setQueryCategory] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(defaultCategories);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // detectar edición
  useEffect(() => {
    if (params?.edit && params.expenseId) {
      setIsEdit(true);
      setEditingId(params.expenseId);
    }
  }, [params]);

  // cargar datos desde BD
  useEffect(() => {
    (async () => {
      if (params?.edit && params.expenseId) {
        const { data } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', params.expenseId)
          .maybeSingle();

        if (data) {
          setTitle(String(data.title));
          setCategory(String(data.category));
          setAmount(String(data.amount));
          setQueryCategory(String(data.category));
          setShowSuggestions(false);
        }
      }
    })();
  }, [params]);

  // filtro de categorías
  useEffect(() => {
    const q = queryCategory.trim().toLowerCase();
    if (!q) {
      setFilteredCategories(defaultCategories);
      return;
    }
    const filtered = defaultCategories.filter((c) => c.toLowerCase().includes(q));
    setFilteredCategories(filtered.length ? filtered : [t('Crear nueva categoría', 'Create new category')]);
  }, [queryCategory]);

  const selectCategory = (c: string) => {
    if (c === t('Crear nueva categoría', 'Create new category')) {
      setCategory('');
      setQueryCategory('');
      setShowSuggestions(false);
      return;
    }
    setCategory(c);
    setQueryCategory(c);
    setShowSuggestions(false);
  };

  // presupuesto (tu lógica intacta)
  const totalSpent = expenses.reduce((s, it) => s + Number(it.amount), 0);
  const originalExpense = editingId ? expenses.find((e) => e.id === editingId) : undefined;
  const originalAmount = originalExpense ? Number(originalExpense.amount) : 0;

  const parseBudget = (raw: any): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return raw;
    const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  };
  const numericBudget = parseBudget(budget);

  const remaining = numericBudget !== null
    ? numericBudget - totalSpent + (isEdit ? originalAmount : 0)
    : null;

  const parsedAmount = Number(amount || '0');
  const wouldExceed = remaining !== null && parsedAmount > remaining;

  const formatMoney = (n: number | null) =>
    n === null ? '' : `L ${n}`;

  // guardar
  const onSave = async () => {
    const finalCategory = (category || queryCategory).trim() || 'General';
    if (!title.trim()) return Alert.alert('Error', t('Ingrese un título', 'Enter a title'));
    
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0)
      return Alert.alert('Error', t('Ingrese un monto válido', 'Enter a valid amount'));

    // validación presupuesto
    if (numericBudget !== null) {
      const nuevoTotal = (isEdit ? totalSpent - originalAmount : totalSpent) + amt;
      if (nuevoTotal > numericBudget) {
        return Alert.alert(
          t('Presupuesto excedido', 'Budget exceeded'),
          t(
            'No se puede registrar este gasto.',
            'You cannot register this expense.'
          )
        );
      }
    }

    setSaving(true);
    try {
      if (isEdit && editingId) {
        await updateExpense({
          id: editingId,
          title: title.trim(),
          category: finalCategory,
          amount: amt,
        });
        await refresh();
        Alert.alert(t('Listo', 'Done'), t('Gasto actualizado', 'Expense updated'));
        navigation.navigate('Home' as never);
        return;
      }

      await addExpense({ title: title.trim(), category: finalCategory, amount: amt });
      Alert.alert(t('Listo', 'Done'), t('Gasto guardado', 'Expense saved'));
      navigation.navigate('Home' as never);
    } catch (e) {
      Alert.alert('Error', t('No se pudo guardar el gasto.', 'Could not save expense.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEdit ? t('Editar gasto', 'Edit expense') : t('Nuevo gasto', 'New expense')}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>{t('Título', 'Title')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('Ej: Almuerzo', 'Ex: Lunch')}
          placeholderTextColor={colors.subtle}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('Categoría', 'Category')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={queryCategory}
          onChangeText={(t) => {
            setQueryCategory(t);
            setShowSuggestions(true);
            if (t !== category) setCategory('');
          }}
          placeholder={t('Escribe o selecciona una categoría', 'Type or select a category')}
          placeholderTextColor={colors.subtle}
        />

        {/* sugerencias */}
        {showSuggestions && (
          <View style={[styles.suggestionsWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectCategory(item)}>
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          </View>
        )}

        <Text style={[styles.label, { marginTop: 10, color: colors.subtle }]}>{t('Seleccionado', 'Selected')}:</Text>
        <Text style={{ fontWeight: '700', marginTop: 4, color: colors.text }}>
          {(category || queryCategory) || '—'}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>{t('Monto', 'Amount')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.subtle}
          keyboardType="numeric"
        />

        {/* presupuesto info */}
        {numericBudget !== null && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colors.text }}>
              {t('Presupuesto', 'Budget')}: <Text style={{ fontWeight: '700' }}>{formatMoney(numericBudget)}</Text>
            </Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>
              {t('Gastado', 'Spent')}: <Text style={{ fontWeight: '700' }}>{formatMoney(isEdit ? totalSpent - originalAmount : totalSpent)}</Text>
            </Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>
              {t('Disponible', 'Available')}:{' '}
              <Text style={{ fontWeight: '700', color: remaining !== null && remaining < 0 ? 'red' : colors.text }}>
                {formatMoney(remaining)}
              </Text>
            </Text>
            {wouldExceed && (
              <Text style={{ color: 'red', marginTop: 6 }}>
                {t('Este gasto excede tu presupuesto disponible.', 'This expense exceeds your remaining budget.')}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#0a84ff' : '#1976d2' }]}
          onPress={onSave}
          disabled={saving || wouldExceed}
        >
          <Text style={styles.buttonText}>
            {saving
              ? t('Guardando...', 'Saving...')
              : isEdit
              ? t('Actualizar', 'Update')
              : t('Guardar gasto', 'Save expense')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 6, fontSize: 14 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  suggestionsWrap: {
    maxHeight: 140,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 15,
  },
  button: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
