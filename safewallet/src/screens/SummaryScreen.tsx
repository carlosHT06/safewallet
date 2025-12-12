import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useExpenses } from '../context/ExpensesContext';
import { useSettings } from '../context/SettingsContext';
import { getRate } from '../services/exchangeService';

const screenWidth = Dimensions.get('window').width;

export default function SummaryScreen() {
  const { expenses, budget } = useExpenses();
  const { currency, activeTheme, loading: settingsLoading } = useSettings();

  const [rate, setRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  /* ---------------------- Tasa de cambio --------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (currency === 'HNL') {
        if (mounted) setRate(1);
        return;
      }
      setLoadingRate(true);
      try {
        const r = await getRate('HNL', currency);
        if (mounted) setRate(Number(r));
      } catch (e) {
        console.warn('[SummaryScreen] getRate', e);
        if (mounted) setRate(null);
      } finally {
        if (mounted) setLoadingRate(false);
      }
    })();
    return () => { mounted = false; };
  }, [currency]);

  /* ---------------------- Montos ---------------------- */
  const totalSpentHNL = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const numericBudgetHNL = (() => {
    if (!budget) return null;
    const cleaned = String(budget).replace(/[^0-9.-]+/g, '');
    const n = cleaned ? Number(cleaned) : NaN;
    return isNaN(n) ? null : n;
  })();

  const totalSpent = rate != null ? totalSpentHNL * rate : null;
  const numericBudget = (rate != null && numericBudgetHNL != null) ? numericBudgetHNL * rate : null;
  const remaining = numericBudget != null ? numericBudget - (totalSpent ?? 0) : null;

  /* ---------------------- Categorías ---------------------- */
  const categoriesHNL = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((ex) => {
      const cat = ex.category ?? 'General';
      map[cat] = (map[cat] || 0) + Number(ex.amount);
    });
    return map;
  }, [expenses]);

  const categories = useMemo(() => {
    if (rate == null) return categoriesHNL;
    const map: Record<string, number> = {};
    Object.keys(categoriesHNL).forEach((k) => {
      map[k] = categoriesHNL[k] * rate;
    });
    return map;
  }, [categoriesHNL, rate]);

  const hasData = expenses.length > 0;

  const pieData = Object.keys(categories).map((cat, i) => ({
    key: `${cat}-${i}`,
    name: cat,
    population: categories[cat],
    color: chartColors[i % chartColors.length],
    legendFontColor: activeTheme.text,
    legendFontSize: 14,
  }));

  const barData = {
    labels: Object.keys(categories),
    datasets: [{ data: Object.values(categories) }],
  };

  const formatMoney = (n: number | null) => {
    if (n === null) return '-';
    return `${currency === 'HNL' ? 'L' : '$'} ${n.toFixed(2)}`;
  };

  if (settingsLoading) return <View style={styles.center}><ActivityIndicator color={activeTheme.primary} /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeTheme.background }]}>
      
      <Text style={[styles.title, { color: activeTheme.text }]}>
        Resumen de Gastos
      </Text>

      {/* Caja de presupuesto */}
      <View style={[styles.budgetBox, { backgroundColor: activeTheme.card }]}>
        <Text style={[styles.budgetLabel, { color: activeTheme.text }]}>Presupuesto total</Text>
        <Text style={[styles.budgetValue, { color: activeTheme.text }]}>
          {formatMoney(numericBudget)}
        </Text>

        <View style={styles.rcRow}>
          <View style={styles.rcCol}>
            <Text style={[styles.smallLabel, { color: activeTheme.text }]}>Gastado</Text>
            <Text style={[styles.smallValue, { color: activeTheme.text }]}>
              {formatMoney(totalSpent)}
            </Text>
          </View>

          <View style={styles.rcCol}>
            <Text style={[styles.smallLabel, { color: activeTheme.text }]}>Disponible</Text>
            <Text
              style={[
                styles.smallValue,
                { color: remaining != null && remaining < 0 ? 'red' : activeTheme.text }
              ]}
            >
              {formatMoney(remaining)}
            </Text>
          </View>
        </View>

        {loadingRate && (
          <Text style={{ marginTop: 8, color: activeTheme.text }}>
            Actualizando tasas...
          </Text>
        )}
      </View>

      {/* Si no hay datos */}
      {!hasData && (
        <View style={[styles.noDataBox, { backgroundColor: activeTheme.card }]}>
          <Text style={[styles.noDataText, { color: activeTheme.text }]}>
            No se han registrado gastos aún.
          </Text>
        </View>
      )}

      {/* Sí hay datos */}
      {hasData && (
        <>
          {pieData.length > 0 && (
            <>
              <Text style={[styles.subtitle, { color: activeTheme.text }]}>
                Gastos por categoría ({currency})
              </Text>

              <PieChart
                data={pieData}
                width={screenWidth - 20}
                height={220}
                chartConfig={chartConfig(activeTheme)}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </>
          )}

          {Object.keys(categories).length > 0 && (
            <>
              <Text style={[styles.subtitle, { color: activeTheme.text }]}>
                Comparación de categorías ({currency})
              </Text>

              <BarChart
                data={barData}
                width={screenWidth - 20}
                height={260}
                fromZero
                showValuesOnTopOfBars
                chartConfig={chartConfig(activeTheme)}
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

/* ---------------------- Colores de gráfica ---------------------- */
const chartColors = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#FFC107'];

const chartConfig = (theme: any) => ({
  backgroundGradientFrom: theme.background,
  backgroundGradientTo: theme.background,
  color: (opacity = 1) => theme.text + Math.round(opacity * 255).toString(16),
  decimalPlaces: 2,
});

/* ---------------------- Estilos ---------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { textAlign: 'center', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: '600', marginVertical: 10 },

  budgetBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  budgetLabel: { fontSize: 14 },
  budgetValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },

  rcRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  rcCol: { flex: 1, alignItems: 'flex-start' },

  smallLabel: {},
  smallValue: { fontWeight: '700', marginTop: 4 },

  noDataBox: { padding: 20, borderRadius: 10, marginTop: 20 },
  noDataText: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
