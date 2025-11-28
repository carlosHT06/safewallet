// src/screens/SummaryScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, ScrollView } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useExpenses } from '../context/ExpensesContext';

const screenWidth = Dimensions.get('window').width;

export default function SummaryScreen() {
  const { expenses } = useExpenses();

  // presupuesto mensual ingresado por usuario
  const [budget, setBudget] = useState('');

  // total gastado
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  // dinero disponible
  const available = budget ? Number(budget) - totalSpent : null;

  // agrupar por categoría
  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((ex) => {
      const cat = ex.category ?? 'General';
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(ex.amount);
    });
    return map;
  }, [expenses]);

  // data para PieChart
  const pieData = Object.keys(categories).map((cat, i) => ({
    key: `${cat}-${i}`,
    name: cat,
    amount: categories[cat],
    color: colors[i % colors.length],
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  // data para BarChart
  const barData = {
    labels: Object.keys(categories),
    datasets: [
      {
        data: Object.keys(categories).map((c) => categories[c]),
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resumen de Gastos</Text>

      {/* PRESUPUESTO */}
      <View style={styles.card}>
        <Text style={styles.label}>Presupuesto mensual:</Text>
        <TextInput
          placeholder="Ej: 5000"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
          style={styles.input}
        />

        {budget ? (
          <>
            <Text style={styles.info}>Total gastado: L {totalSpent}</Text>
            <Text style={styles.info}>
              Disponible:{' '}
              <Text style={{ color: available !== null && available < 0 ? 'red' : 'green' }}>
                L {available}
              </Text>
            </Text>
          </>
        ) : (
          <Text style={styles.info}>Introduce tu presupuesto para calcular tu disponible.</Text>
        )}
      </View>

      {/* PIE CHART */}
      {pieData.length > 0 && (
        <>
          <Text style={styles.subtitle}>Gastos por categoría</Text>
          <PieChart
            data={pieData.map((item) => ({
              name: item.name,
              population: item.amount,
              color: item.color,
              legendFontColor: item.legendFontColor,
              legendFontSize: item.legendFontSize,
            }))}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </>
      )}

      {/* BAR CHART */}
      {Object.keys(categories).length > 0 && (
        <>
          <Text style={styles.subtitle}>Comparación de categorías</Text>
          <BarChart
            data={barData}
            width={screenWidth - 15}
            height={260}
            fromZero
            showValuesOnTopOfBars
            chartConfig={chartConfig}
            style={{ borderRadius: 12 }}
            // Props requeridas por las definiciones de tipos (pueden estar vacías)
            yAxisLabel=""
            yAxisSuffix=""
          />
        </>
      )}
    </ScrollView>
  );
}

const colors = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#FFC107'];

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#f3f3f3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: { fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  info: { fontSize: 16, marginBottom: 4 },
});
