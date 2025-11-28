import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; 

export default function ProfileScreen() {
  const { profile, loading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!profile) {
      setName('');
      setPhone('');
      setEmail('');
      return;
    }
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setEmail(profile.email ?? '');
  }, [profile]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{name || 'Sin nombre'}</Text>

        <Text style={styles.label}>Teléfono</Text>
        <Text style={styles.value}>{phone || 'No registrado'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email || '...'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#f7f7f7',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  label: {
    color: '#666',
    fontWeight: '600',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#222',
    marginTop: 2,
  },
});
