import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { useExpenses } from '../context/ExpensesContext';

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const save = () => {
    if (!title || !category || !amount) {
      return Alert.alert("Error", "Completa todos los campos");
    }

    addExpense({
      title,
      category,
      amount: Number(amount),
    });

    Alert.alert("Éxito", "Gasto agregado");
    setTitle("");
    setCategory("");
    setAmount("");
  };

  return (
    <View style={styles.container}>
      <CustomInput label="Descripción" value={title} onChangeText={setTitle} />
      <CustomInput label="Categoría" value={category} onChangeText={setCategory} />
      <CustomInput label="Monto" value={amount} onChangeText={setAmount} keyboardType="numeric" />

      <CustomButton title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }
});
