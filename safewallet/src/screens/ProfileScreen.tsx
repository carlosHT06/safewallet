import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserBudget, updateUserBudget } from '../services/supabase';

export default function ProfileScreen() {
  const { profile, loading, refreshProfile, sessionUser } = useAuth();
  const userId = sessionUser?.id ?? profile?.id ?? null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [budget, setBudget] = useState<number>(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    if (!profile) {
      setName('');
      setPhone('');
      setEmail('');
    } else {
      setName(profile.name ?? '');
      setPhone(profile.phone ?? '');
      setEmail(profile.email ?? '');
    }
  }, [profile]);

  // cargar presupuesto (primero desde profile si viene, si no, desde servicio)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) return;
      try {
        // si profile tiene budget, usarlo (evita llamada extra)
        if (profile && typeof profile.budget !== 'undefined') {
          if (mounted) {
            setBudget(Number(profile.budget ?? 0));
            setBudgetInput(Number(profile.budget ?? 0).toFixed(2));
          }
        } else {
          const b = await getUserBudget(userId);
          if (mounted) {
            setBudget(Number(b ?? 0));
            setBudgetInput(Number(b ?? 0).toFixed(2));
          }
        }
      } catch (e) {
        console.warn('[ProfileScreen] load budget', e);
      }
    })();
    return () => { mounted = false; };
  }, [userId, profile]);

  const onSaveBudget = async () => {
    if (!userId) return Alert.alert('Error', 'Usuario no autenticado.');
    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) return Alert.alert('Error', 'Introduce un monto válido.');
    setSavingBudget(true);
    try {
      await updateUserBudget(userId, val);
      setBudget(val);
      setEditingBudget(false);
      // refrescar profile en contexto (si lo guardas en users)
      try { await refreshProfile(); } catch {}
      Alert.alert('Listo', 'Presupuesto actualizado.');
    } catch (err: any) {
      console.error('[ProfileScreen] updateBudget', err);
      Alert.alert('Error', err?.message ?? 'No se pudo actualizar presupuesto.');
    } finally {
      setSavingBudget(false);
    }
  };

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

        <View style={{ height: 1, backgroundColor: '#eaeaea', marginVertical: 12 }} />

        <Text style={styles.label}>Presupuesto mensual</Text>

        {!editingBudget ? (
          <>
            <Text style={[styles.value, { fontSize: 20 }]}>
              ${Number(budget ?? 0).toFixed(2)}
            </Text>

            <TouchableOpacity
              style={[styles.settingsButton, { marginTop: 12 }]}
              onPress={() => {
                setEditingBudget(true);
                setBudgetInput(Number(budget ?? 0).toFixed(2));
              }}
            >
              <Text style={styles.settingsText}>Editar presupuesto</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              placeholder="Ej: 1000.00"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1 }]}
                onPress={onSaveBudget}
                disabled={savingBudget}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{savingBudget ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => setEditingBudget(false)}
                disabled={savingBudget}
              >
                <Text style={{ color: '#1976d2', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Nota: el antiguo botón "Configuración" ahora abrirá la pantalla Settings
          donde pondremos tema / idioma — puedes mantenerlo si quieres */}
      <TouchableOpacity
        style={[styles.settingsButton, { marginTop: 18 }]}
        onPress={() => {
          // navegar a Settings (si está registrado)
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useNavigation } = require('@react-navigation/native');
            const nav = useNavigation();
            // @ts-ignore
            nav.navigate('Settings');
          } catch {
            // si no podemos navegar, simplemente ignorar
          }
        }}
      >
        <Text style={styles.settingsText}>Configuración (tema / idioma)</Text>
      </TouchableOpacity>
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
  settingsButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsText: { color: '#1976d2', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
