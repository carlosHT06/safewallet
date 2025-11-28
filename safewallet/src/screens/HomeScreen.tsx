// src/screens/HomeScreen.tsx
import React from 'react';
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
  const { expenses, loading, refresh, removeExpense } = useExpenses();

  const onLogout = async () => {
    try {
      await signOutUser();
      // after sign out navigate to login (stack)
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
            Alert.alert('Eliminado', 'Gasto eliminado correctamente.');
          } catch (err) {
            console.error('delete error', err);
            Alert.alert('Error', 'No se pudo eliminar el gasto.');
          }
        },
      },
    ]);
  };

  const onEdit = (id: string) => {
    // navigate to tab AddExpense in edit mode passing expenseId
    navigation.navigate('AddExpense', { edit: true, expenseId: id } as any);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.item}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemDate}>{item.date}</Text>
        </View>

        <View style={{ justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.smallBtn}>
            <Text style={{ color: '#1976d2' }}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item.id)} style={[styles.smallBtn, { marginTop: 8 }]}>
            <Text style={{ color: '#d32f2f' }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.itemAmount}>L {Number(item.amount).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tus gastos</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={refresh} style={{ marginRight: 12 }}>
            <Text style={styles.link}>Actualizar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Text style={[styles.link, { color: '#d32f2f' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.center}>
          <Text>No hay gastos todavía.</Text>
        </View>
      ) : (
        <FlatList data={expenses} keyExtractor={(item) => item.id} renderItem={renderItem} />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  link: { color: '#1976d2', fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  item: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  itemTitle: { fontWeight: '700', marginBottom: 2 },
  itemCategory: { color: '#666', marginBottom: 4 },
  itemAmount: { fontWeight: '700', marginTop: 8 },
  itemDate: { fontSize: 12, color: '#999' },
  smallBtn: { padding: 6 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
