// src/screens/SummaryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenses } from '../context/ExpensesContext';

const SummaryScreen = () => {
  const { expenses } = useExpenses();

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resumen</Text>
      <Text style={styles.total}>Total: L {total.toFixed(2)}</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Por categoría</Text>
        {Object.entries(byCategory).map(([cat, val]) => (
          <View key={cat} style={styles.row}>
            <Text>{cat}</Text>
            <Text>L {val.toFixed(2)}</Text>
          </View>
        ))}
        {Object.keys(byCategory).length === 0 && <Text style={{ marginTop: 10 }}>No hay gastos</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  total: { fontSize: 18, marginBottom: 12 },
  section: { marginTop: 12 },
  subtitle: { fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});

export default SummaryScreen;
