import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SummaryScreen: React.FC = () => {
  const weeklyTotal = 390; // ejemplo
  const monthlyTotal = 2100; // ejemplo

  const weeklyPercentage = 45;
  const monthlyPercentage = 70;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gasto semanal</Text>
        <Text style={styles.amount}>L {weeklyTotal.toFixed(2)}</Text>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${weeklyPercentage}%` }]} />
        </View>
        <Text style={styles.barLabel}>{weeklyPercentage}% del presupuesto</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gasto mensual</Text>
        <Text style={styles.amount}>L {monthlyTotal.toFixed(2)}</Text>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${monthlyPercentage}%` }]} />
        </View>
        <Text style={styles.barLabel}>{monthlyPercentage}% del presupuesto</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  amount: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  barBackground: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  barLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#4b5563',
  },
});

export default SummaryScreen;
