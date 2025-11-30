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
import { SupabaseExpense, updateExpense } from '../services/supabase';

type NavProp = BottomTabNavigationProp<TabParamList, 'AddExpense'>;

// Lista predeterminada de categorías (modifica según necesites)
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
  'Otra',
];

export default function AddExpenseScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute();
  const { addExpense, refresh, expenses, budget } = useExpenses();

  const params: any = (route.params ?? {}) as { edit?: boolean; expenseId?: string };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Para las sugerencias / filtro
  const [queryCategory, setQueryCategory] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<string[]>(defaultCategories);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Prefill si es edición (usa tu fetch actual)
  useEffect(() => {
    try {
      if (params?.edit && params.expenseId) {
        setIsEdit(true);
        setEditingId(params.expenseId);
      }
    } catch (e) {
      console.warn('prefill edit error', e);
    }
  }, [params]);

  // Cargar datos de la fila cuando editingId esté listo
  useEffect(() => {
    (async () => {
      if (params?.edit && params.expenseId) {
        try {
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
            setQueryCategory(String(data.category ?? ''));
            setShowSuggestions(false);
          }
        } catch (err) {
          console.warn('prefill fetch exception', err);
        }
      }
    })();
  }, [params]);

  // filtrar categorías según lo que el usuario escriba
  useEffect(() => {
    const q = queryCategory.trim().toLowerCase();
    if (!q) {
      setFilteredCategories(defaultCategories);
      return;
    }
    const filtered = defaultCategories.filter((c) => c.toLowerCase().includes(q));
    // si no hay coincidencias, mostrar la opción "Crear nueva"
    setFilteredCategories(filtered.length ? filtered : ['Crear nueva categoría']);
  }, [queryCategory]);

  const selectCategory = (c: string) => {
    if (c === 'Crear nueva categoría') {
      // dejar campo para escribir
      setCategory('');
      setQueryCategory('');
      setShowSuggestions(false);
      return;
    }
    setCategory(c);
    setQueryCategory(c);
    setShowSuggestions(false);
  };

  // --- CÁLCULOS DE PRESUPUESTO ---
  const totalSpent = expenses.reduce((s, it) => s + Number(it.amount), 0);

  // si estamos editando, obtener el monto original de ese gasto para ajustar el cálculo
  const originalExpense = editingId ? expenses.find((e) => e.id === editingId) : undefined;
  const originalAmount = originalExpense ? Number(originalExpense.amount) : 0;

  // parse budget defensively (acepta string con $ o número)
  const parseBudgetToNumber = (raw: any): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return raw;
    const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
    const n = cleaned ? Number(cleaned) : NaN;
    return isNaN(n) ? null : n;
  };
  const numericBudget = parseBudgetToNumber(budget);

  // restante disponible teniendo en cuenta si estamos editando (no restar originalAmount si no estamos editando)
  const remaining = numericBudget !== null
    ? numericBudget - totalSpent + (isEdit ? originalAmount : 0)
    : null;

  // determinar si el monto ingresado excede el presupuesto
  const parsedAmount = Number(amount || '0');
  const wouldExceed = remaining !== null && parsedAmount > remaining;

  // formato simple para mostrar monedas (puedes cambiar)
  const formatMoney = (n: number | null) => {
    if (n === null) return '';
    return `L ${n}`;
  };
  // --- FIN cálculo presupuesto ---

  const onSave = async () => {
    const finalCategory = (category || queryCategory).trim() || 'General';
    if (!title.trim()) return Alert.alert('Error', 'Ingrese un título');
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Error', 'Ingrese un monto válido');

    // Validación local contra presupuesto (defensiva)
    if (numericBudget !== null) {
      const nuevoTotalIfSave = (isEdit ? totalSpent - originalAmount : totalSpent) + amt;
      if (nuevoTotalIfSave > numericBudget) {
        const gastadoActualmente = (isEdit ? totalSpent - originalAmount : totalSpent);
        const disponible = numericBudget - gastadoActualmente;
        Alert.alert(
          'Presupuesto excedido',
          `No se puede registrar este gasto porque excede tu presupuesto.\n\nPresupuesto: ${formatMoney(numericBudget)}\nGastado actualmente: ${formatMoney(gastadoActualmente)}\nDisponible: ${formatMoney(disponible >= 0 ? disponible : 0)}`
        );
        return; // detener guardado
      }
    }

    setSaving(true);
    try {
      if (params?.edit && editingId) {
        await updateExpense({
          id: editingId,
          title: title.trim(),
          category: finalCategory,
          amount: amt,
        });
        await refresh();
        Alert.alert('Listo', 'Gasto actualizado');
        navigation.navigate('Home' as never);
        return;
      }

      await addExpense({ title: title.trim(), category: finalCategory, amount: amt });
      Alert.alert('Listo', 'Gasto guardado');
      navigation.navigate('Home' as never);
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

        {/* Input que muestra sugerencias mientras se escribe */}
        <TextInput
          style={styles.input}
          value={queryCategory}
          onChangeText={(t) => {
            setQueryCategory(t);
            setShowSuggestions(true);
            // si el usuario borra y ya había seleccionado una categoría, queremos limpiar la selección
            if (t !== category) setCategory('');
          }}
          placeholder="Escribe o selecciona una categoría"
        />

        {/* Sugerencias (se muestran si showSuggestions es true) */}
        {showSuggestions && (
          <View style={styles.suggestionsWrap}>
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectCategory(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          </View>
        )}

        {/* Si eligió una categoría (o si escribió pero no la guardó), mostramos la selección */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: '#666' }}>Seleccionado:</Text>
          <Text style={{ fontWeight: '700', marginTop: 4 }}>{(category || queryCategory) || 'Ninguno'}</Text>
        </View>

        <Text style={styles.label}>Monto</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />

        {/* Mostrar info de presupuesto (si existe) */}
        {numericBudget !== null && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>
              Presupuesto: <Text style={{ fontWeight: '700' }}>{formatMoney(numericBudget)}</Text>
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
              Gastado: <Text style={{ fontWeight: '700' }}>{formatMoney(isEdit ? totalSpent - originalAmount : totalSpent)}</Text>
            </Text>
            <Text style={{ fontSize: 14, marginTop: 4 }}>
              Disponible:{' '}
              <Text style={{ fontWeight: '700', color: (remaining !== null && remaining < 0) ? 'red' : '#000' }}>
                {formatMoney(remaining)}
              </Text>
            </Text>
            {wouldExceed && (
              <Text style={{ marginTop: 8, color: 'red', fontWeight: '600' }}>
                Este gasto excede tu presupuesto disponible.
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, (saving || wouldExceed) && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving || wouldExceed}
        >
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
  suggestionsWrap: {
    maxHeight: 140,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  suggestionText: { fontSize: 15 },
  button: {
    marginTop: 18,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
