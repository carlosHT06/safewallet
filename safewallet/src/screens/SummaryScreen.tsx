import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useExpenses } from '../context/ExpensesContext';

const screenWidth = Dimensions.get('window').width;

export default function SummaryScreen() {
  const { expenses } = useExpenses();

  // total gastado
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

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

  const hasData = expenses.length > 0;

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

      {/* MENSAJE SI NO HAY DATOS */}
      {!hasData && (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>No se han registrado datos aún.</Text>
        </View>
      )}

      {/* GRÁFICAS SOLO SI HAY DATOS */}
      {hasData && (
        <>
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

  // estilos del mensaje de "no hay datos"
  noDataBox: {
    backgroundColor: '#f3f3f3',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
