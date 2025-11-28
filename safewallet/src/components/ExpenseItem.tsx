import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../context/ExpensesContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  expense: Expense;
  onDelete?: () => void;
}

const ExpenseItem: React.FC<Props> = ({ expense, onDelete }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={styles.category}>{expense.category}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>L {Number(expense.amount).toFixed(2)}</Text>
        <Text style={styles.date}>{expense.date}</Text>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#b71c1c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  right: { alignItems: 'flex-end' },
  title: { fontWeight: '700', fontSize: 16 },
  category: { fontSize: 12, color: '#757575' },
  amount: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12, color: '#9E9E9E' },
  deleteBtn: { marginTop: 6 },
});

export default ExpenseItem;
