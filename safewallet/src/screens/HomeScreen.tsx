// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import ExpenseItem from '../components/ExpenseItem';
import { RootState, AppDispatch } from '../store/store';
import { removeExpense } from '../store/expensesSlice';

const HomeScreen = () => {
  const expenses = useSelector((state: RootState) => state.expenses.list);
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Seguro que deseas eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => dispatch(removeExpense(id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos Recientes</Text>

      {/* Ejemplo de uso del segundo slice (auth) */}
      {auth.isLoggedIn && auth.email && (
        <Text style={styles.subtitle}>Sesión activa: {auth.email}</Text>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem expense={item} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 12, color: '#555' },
});

export default HomeScreen;
