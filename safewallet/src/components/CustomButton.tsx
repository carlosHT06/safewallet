// src/components/CustomButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
}

const CustomButton: React.FC<Props> = ({ title, onPress }) => (
  <TouchableOpacity style={styles.btn} onPress={onPress}>
    <Text style={styles.txt}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: { backgroundColor: '#4caf50', padding: 12, borderRadius: 8, alignItems: 'center' },
  txt: { color: '#fff', fontWeight: '700' },
});

export default CustomButton;
