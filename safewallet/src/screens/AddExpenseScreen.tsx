// src/screens/AddExpenseScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { useExpenses } from '../context/ExpensesContext';
import { useNavigation } from '@react-navigation/native';

const AddExpenseScreen = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<any>({});

  const { addExpense } = useExpenses();
  const navigation = useNavigation<any>();

  const validate = () => {
    const newErrors: any = {};

    if (!title) newErrors.title = 'Descripción obligatoria';
    if (!category) newErrors.category = 'Categoría obligatoria';
    if (!amount || isNaN(Number(amount))) newErrors.amount = 'Monto inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveExpense = () => {
    if (!validate()) return;

    addExpense({
      title,
      category,
      amount: Number(amount),
    });

    Alert.alert('Gasto agregado', 'Tu gasto se guardó correctamente.');

    setTitle('');
    setCategory('');
    setAmount('');

    // Opcional: regresar al tab de Home
    // @ts-ignore
    navigation.navigate('AppTabs');
  };

  return (
    <View style={styles.container}>
      <CustomInput label="Descripción" value={title} onChangeText={setTitle} error={errors.title} />
      <CustomInput label="Categoría" value={category} onChangeText={setCategory} error={errors.category} />
      <CustomInput
        label="Monto"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        error={errors.amount}
      />

      <CustomButton title="Guardar" onPress={saveExpense} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});

export default AddExpenseScreen;
