import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

interface Props {
  expense: Expense;
}

const ExpenseItem: React.FC<Props> = ({ expense }) => {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.description}>{expense.description}</Text>
        <Text style={styles.meta}>
          {expense.category} · {expense.date}
        </Text>
      </View>
      <Text style={styles.amount}>L {expense.amount.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    color: '#6b7280',
    fontSize: 12,
  },
  amount: {
    marginLeft: 12,
    fontWeight: '700',
    fontSize: 16,
    color: '#dc2626',
  },
});

export default ExpenseItem;
