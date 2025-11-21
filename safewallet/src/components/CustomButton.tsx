import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

type Variant = 'primary' | 'secondary';

interface Props {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
}

const CustomButton: React.FC<Props> = ({ title, onPress, variant = 'primary', disabled }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 6,
  },
  secondary: {
    backgroundColor: '#e5e7eb',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryText: {
    color: '#111827',
  },
});

export default CustomButton;
