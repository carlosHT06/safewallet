import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ExpenseItem, { Expense } from '../components/ExpenseItem';

const MOCK_EXPENSES: Expense[] = [
  { id: '1', description: 'Almuerzo universitario', category: 'Comida', amount: 150, date: 'Lun' },
  { id: '2', description: 'Bus a la U', category: 'Transporte', amount: 40, date: 'Mar' },
  { id: '3', description: 'Netflix', category: 'Entretenimiento', amount: 200, date: 'Mié' },
];

const HomeScreen: React.FC = () => {
  const total = MOCK_EXPENSES.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos recientes</Text>
      <Text style={styles.total}>Total de la semana: L {total.toFixed(2)}</Text>

      <FlatList
        data={MOCK_EXPENSES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseItem expense={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  total: { fontSize: 16, marginBottom: 16, color: '#374151' },
});

export default HomeScreen;
