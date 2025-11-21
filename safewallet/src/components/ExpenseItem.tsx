import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense } from '../context/ExpensesContext';

interface Props {
  expense: Expense;
  onDelete: () => void;
}

export default function ExpenseItem({ expense, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{expense.title}</Text>
        <Text style={styles.category}>{expense.category}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>L {expense.amount}</Text>
        <Text style={styles.date}>{expense.date}</Text>

        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEE",
    padding: 14,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: { fontSize: 16, fontWeight: "600" },
  category: { color: "#555" },
  right: { alignItems: "flex-end" },
  amount: { fontWeight: "700" },
  date: { fontSize: 12, color: "#666" },
});
