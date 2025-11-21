import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ExpenseItem from '../components/ExpenseItem';
import { useExpenses } from '../context/ExpensesContext';

const HomeScreen = () => {
  const { expenses, removeExpense } = useExpenses();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos Recientes</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onDelete={() => removeExpense(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
});

export default HomeScreen;
