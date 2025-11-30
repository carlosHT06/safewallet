import React, { useState } from 'react';
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

type NavProp = BottomTabNavigationProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { expenses, loading, refresh, removeExpense, clearAllExpenses } = useExpenses();
  const [clearing, setClearing] = useState(false);

  const onLogout = async () => {
    try {
      await signOutUser();
      navigation.getParent()?.navigate('Login' as any);
    } catch (err) {
      console.error('Logout error', err);
      Alert.alert('Error', 'No se pudo cerrar sesión. Revisa la consola.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Eliminar gasto', '¿Estás seguro de eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeExpense(id);
          } catch (err) {
            console.error('delete error', err);
            Alert.alert('Error', 'No se pudo eliminar el gasto.');
          }
        },
      },
    ]);
  };

  const onEdit = (id: string) => {
    navigation.navigate('AddExpense', { edit: true, expenseId: id } as any);
  };

  const onClearPress = () => {
    if (!expenses || expenses.length === 0) {
      return Alert.alert('Sin gastos', 'No hay gastos para eliminar.');
    }
    Alert.alert(
      'Confirmar eliminación',
      '¿Seguro que quieres eliminar TODOS los gastos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearAllExpenses(true);
            } catch (e) {
              console.error('clearAllExpenses', e);
              Alert.alert('Error', 'No se pudieron eliminar todos los gastos.');
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title || 'Sin título'}</Text>
          <Text style={styles.meta}>
            {item.category ?? 'General'} · {formatDate(item.date)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.actionBtn}>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: '#d32f2f' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.amount}>L {Number(item.amount).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER CENTRADO */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={styles.headerTitle}>Tus gastos</Text>

        <View style={styles.headerActionsCentered}>
          <TouchableOpacity onPress={refresh} style={styles.linkBtn}>
            <Text style={styles.linkText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClearPress} disabled={clearing} style={styles.linkBtn}>
            {clearing ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={[styles.linkText, { color: '#d32f2f' }]}>Limpiar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: '#777' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No hay gastos todavía. Añade uno con el botón +</Text>
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
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
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
  container: { flex: 1, padding: 16, backgroundColor: '#f5f6fa' },

  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },

  /* Botones centrados */
  headerActionsCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  linkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginHorizontal: 10,
  },

  linkText: { color: '#1976d2', fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#666' },

  card: {
    backgroundColor: '#fff',
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

  title: { fontWeight: '700', fontSize: 16, color: '#111', marginBottom: 6 },
  meta: { color: '#8a8a8a', fontSize: 13 },

  actions: { alignItems: 'flex-end', justifyContent: 'center' },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  actionText: { color: '#1976d2', fontWeight: '700' },

  amount: { marginTop: 10, fontWeight: '800', fontSize: 16, color: '#222' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32 },
});
