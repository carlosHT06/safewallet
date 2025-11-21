import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const AddExpenseScreen: React.FC = () => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{
    description?: string;
    category?: string;
    amount?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!description) newErrors.description = 'La descripción es obligatoria';
    if (!category) newErrors.category = 'La categoría es obligatoria';

    const numericAmount = Number(amount);
    if (!amount) newErrors.amount = 'El monto es obligatorio';
    else if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Ingresa un monto válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    Alert.alert(
      'Gasto registrado',
      `Descripción: ${description}\nCategoría: ${category}\nMonto: L ${Number(
        amount,
      ).toFixed(2)}`,
    );

    setDescription('');
    setCategory('');
    setAmount('');
  };

  return (
    <View style={styles.container}>
      <CustomInput
        label="Descripción"
        placeholder="Ej. Café con amigos"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
      />

      <CustomInput
        label="Categoría"
        placeholder="Comida, transporte..."
        value={category}
        onChangeText={setCategory}
        error={errors.category}
      />

      <CustomInput
        label="Monto"
        placeholder="0"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        error={errors.amount}
      />

      <CustomButton title="Guardar gasto" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
});

export default AddExpenseScreen;
