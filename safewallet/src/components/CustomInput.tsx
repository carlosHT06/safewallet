// src/components/CustomInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  error?: string;
}

const CustomInput: React.FC<Props> = ({ label, value, onChangeText, keyboardType, error }) => {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 },
  error: { color: '#b71c1c', marginTop: 4 },
});

export default CustomInput;
