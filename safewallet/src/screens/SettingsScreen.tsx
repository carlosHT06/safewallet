import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; // si lo tienes
import { getUserBudget, updateUserBudget } from '../services/supabase';

export default function SettingsScreen() {
  const { sessionUser, refreshProfile } = useAuth();
  const userId = sessionUser?.id ?? null;

  const [budget, setBudget] = useState<string>('0.00');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const b = await getUserBudget(userId);
        setBudget(Number(b ?? 0).toFixed(2));
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const onSave = async () => {
    if (!userId) return Alert.alert('Error', 'Usuario no autenticado');
    const val = Number(budget);
    if (isNaN(val) || val < 0) return Alert.alert('Error', 'Introduce un monto válido');

    setSaving(true);
    try {
      await updateUserBudget(userId, val);
      Alert.alert('Listo', 'Presupuesto actualizado');
      await refreshProfile(); // opcional: refresca perfil en contexto
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Presupuesto mensual</Text>
        <TextInput
          style={styles.input}
          value={budget}
          onChangeText={(t) => setBudget(t)}
          keyboardType="numeric"
          placeholder="Ej: 1000.00"
        />
        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar presupuesto'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#f7f7f7', padding: 12, borderRadius: 8 },
  label: { fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, marginBottom: 10 },
  saveButton: { backgroundColor: '#1976d2', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
