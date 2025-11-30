import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useExpenses } from '../context/ExpensesContext';

const screenWidth = Dimensions.get('window').width;

export default function SummaryScreen() {
  const { expenses, budget } = useExpenses();

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const parseBudgetToNumber = (raw: any): number | null => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return raw;
    const cleaned = String(raw).replace(/[^0-9.-]+/g, '');
    const n = cleaned ? Number(cleaned) : NaN;
    return isNaN(n) ? null : n;
  };
  const numericBudget = parseBudgetToNumber(budget);
  const remaining = numericBudget !== null ? numericBudget - totalSpent : null;

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((ex) => {
      const cat = ex.category ?? 'General';
      if (!map[cat]) map[cat] = 0;
      map[cat] += Number(ex.amount);
    });
    return map;
  }, [expenses]);

  const hasData = expenses.length > 0;
  const pieData = Object.keys(categories).map((cat, i) => ({
    key: `${cat}-${i}`,
    name: cat,
    amount: categories[cat],
    color: colors[i % colors.length],
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  const barData = {
    labels: Object.keys(categories),
    datasets: [{ data: Object.keys(categories).map((c) => categories[c]) }],
  };

  const formatMoney = (n: number | null) => {
    if (n === null) return '-';
    return `L ${Number.isInteger(n) ? n : n.toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resumen de Gastos</Text>

      <View style={styles.budgetBox}>
        <Text style={styles.budgetLabel}>Presupuesto total</Text>
        <Text style={styles.budgetValue}>{formatMoney(numericBudget)}</Text>

        <View style={styles.rcRow}>
          <View style={styles.rcCol}>
            <Text style={styles.smallLabel}>Gastado</Text>
            <Text style={styles.smallValue}>{formatMoney(totalSpent)}</Text>
          </View>

          <View style={styles.rcCol}>
            <Text style={styles.smallLabel}>Disponible</Text>
            <Text style={[styles.smallValue, remaining !== null && remaining < 0 ? styles.negative : null]}>
              {formatMoney(remaining)}
            </Text>
          </View>
        </View>

        {numericBudget !== null && remaining !== null && remaining <= (numericBudget * 0.15) && (
          <Text style={styles.warningText}>Advertencia: te queda menos del 15% del presupuesto.</Text>
        )}
      </View>

      {!hasData && (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>No se han registrado gastos aún.</Text>
        </View>
      )}

      {hasData && (
        <>
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
                yAxisLabel=""
                yAxisSuffix=""
              />
            </>
          )}
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
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { textAlign: 'center', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: '600', marginVertical: 10 },
  noDataBox: { backgroundColor: '#f3f3f3', padding: 20, borderRadius: 10, marginTop: 20 },
  noDataText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#666' },
  budgetBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4 },
  budgetLabel: { fontSize: 14, color: '#666' },
  budgetValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  rcRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  rcCol: { flex: 1, alignItems: 'flex-start' },
  smallLabel: { color: '#666' },
  smallValue: { fontWeight: '700', marginTop: 4 },
  negative: { color: 'red' },
  warningText: { marginTop: 8, color: '#b71c1c', fontWeight: '700' },
});
