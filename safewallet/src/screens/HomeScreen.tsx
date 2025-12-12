import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useExpenses } from '../context/ExpensesContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types/navigation';
import { signOutUser } from '../services/supabase';
import { useSettings } from '../context/SettingsContext';
import { getRate } from '../services/exchangeService';

type NavProp = BottomTabNavigationProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { expenses, loading, refresh, removeExpense, clearAllExpenses } = useExpenses();
  const { theme, lang, currency } = useSettings();

  const [clearing, setClearing] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#121212' : '#f5f6fa',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#fff' : '#111',
    subtle: isDark ? '#aaa' : '#666',
    red: '#d32f2f',
    primary: '#1976d2',
  };

  const t = (es: string, en: string) => (lang === 'es' ? es : en);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (currency === 'HNL') {
        if (mounted) setRate(1);
        return;
      }
      setLoadingRate(true);
      try {
        const r = await getRate('HNL', currency);
        if (mounted) setRate(Number(r));
      } catch (e) {
        console.warn('[HomeScreen] getRate', e);
        if (mounted) setRate(null);
      } finally {
        if (mounted) setLoadingRate(false);
      }
    })();
    return () => { mounted = false; };
  }, [currency]);

  const onLogout = async () => {
    try {
      await signOutUser();
      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert('Error', t('No se pudo cerrar sesión.', 'Could not sign out.'));
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      t('Eliminar gasto', 'Delete expense'),
      t('¿Estás seguro de eliminar este gasto?', 'Are you sure you want to delete this expense?'),
      [
        { text: t('Cancelar', 'Cancel'), style: 'cancel' },
        {
          text: t('Eliminar', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeExpense(id);
            } catch {
              Alert.alert('Error', t('No se pudo eliminar el gasto.', 'Could not delete expense.'));
            }
          },
        },
      ]
    );
  };

  const onEdit = (id: string) => {
    navigation.navigate('AddExpense', { edit: true, expenseId: id } as any);
  };

  const onClearPress = () => {
    if (!expenses || expenses.length === 0) {
      return Alert.alert(t('Sin gastos', 'No expenses'), t('No hay gastos para eliminar.', 'There are no expenses to delete.'));
    }

    Alert.alert(
      t('Confirmar eliminación', 'Confirm delete'),
      t('¿Seguro que quieres eliminar TODOS los gastos?', 'Are you sure you want to delete ALL expenses?'),
      [
        { text: t('Cancelar', 'Cancel'), style: 'cancel' },
        {
          text: t('Eliminar', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearAllExpenses(true);
            } catch {
              Alert.alert('Error', t('No se pudieron eliminar los gastos.', 'Could not delete expenses.'));
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: any) => {
    const displayAmount = rate != null ? (Number(item.amount) * rate) : Number(item.amount);
    const symbol = currency === 'HNL' ? 'L' : '$';
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title || t('Sin título', 'Untitled')}</Text>
            <Text style={[styles.meta, { color: colors.subtle }]}>
              {item.category ?? 'General'} · {formatDate(item.date)}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.actionBtn}>
              <Text style={[styles.actionText, { color: colors.primary }]}>{t('Editar','Edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.actionBtn}>
              <Text style={[styles.actionText, { color: colors.red }]}>{t('Eliminar','Delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.amount, { color: colors.text }]}>{symbol} {Number.isInteger(displayAmount) ? displayAmount : displayAmount.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Tus gastos','Your expenses')}</Text>

        <View style={styles.headerActionsCentered}>
          <TouchableOpacity onPress={refresh} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('Actualizar','Refresh')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClearPress} disabled={clearing} style={styles.linkBtn}>
            {clearing ? <ActivityIndicator size="small" /> : <Text style={[styles.linkText, { color: colors.red }]}>{t('Limpiar','Clear')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: colors.subtle }]}>{t('Cerrar sesión','Sign out')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.subtle }}>{t('No hay gastos todavía. Añade uno con el botón +','No expenses yet. Add one using the + button')}</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 110 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  headerActionsCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  linkBtn: { paddingVertical: 4, paddingHorizontal: 6, marginHorizontal: 10 },
  linkText: { fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  title: { fontWeight: '700', fontSize: 16 },
  meta: { fontSize: 13 },

  actions: { alignItems: 'flex-end', justifyContent: 'center' },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  actionText: { fontWeight: '700' },

  amount: { marginTop: 10, fontWeight: '800', fontSize: 16 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32 },
});
