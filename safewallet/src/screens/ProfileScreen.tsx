// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserBudget } from '../services/supabase';
import { useExpenses } from '../context/ExpensesContext';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

const i18n = {
  es: {
    title: 'Tu Perfil',
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Email',
    budgetLabel: 'Presupuesto mensual',
    editBudget: 'Editar presupuesto',
    save: 'Guardar',
    cancel: 'Cancelar',
    clearExpensesQuestion:
      '¿Eliminar todos los gastos actuales al cambiar el presupuesto? Esto borrará los registros locales y en el servidor.',
    keep: 'Mantener',
    delete: 'Eliminar',
    done: 'Listo',
    error: 'Error',
    notAuthed: 'Usuario no autenticado.',
    invalidAmount: 'Introduce un monto válido.',
    updatedBudget: 'Presupuesto actualizado.',
    deletedAllExpenses: 'Todos los gastos han sido eliminados.',
    openSettings: 'Configuración (tema / idioma)',
    noName: 'Sin nombre',
    notRegistered: 'No registrado',
  },
  en: {
    title: 'Your Profile',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    budgetLabel: 'Monthly budget',
    editBudget: 'Edit budget',
    save: 'Save',
    cancel: 'Cancel',
    clearExpensesQuestion:
      'Delete all current expenses when changing budget? This will remove local and server records.',
    keep: 'Keep',
    delete: 'Delete',
    done: 'Done',
    error: 'Error',
    notAuthed: 'User not authenticated.',
    invalidAmount: 'Enter a valid amount.',
    updatedBudget: 'Budget updated.',
    deletedAllExpenses: 'All expenses have been deleted.',
    openSettings: 'Settings (theme / language)',
    noName: 'No name',
    notRegistered: 'Not registered',
  },
};

export default function ProfileScreen() {
  const { profile, loading, refreshProfile, sessionUser } = useAuth();
  const userId = sessionUser?.id ?? profile?.id ?? null;

  // setContextBudget from ExpensesContext updates remote DB. We must not call it automatically on load.
  const { setBudget: setContextBudget, clearAllExpenses } = useExpenses();

  const navigation = useNavigation<any>();

  const settings = useSettings();
  const theme = settings?.theme ?? 'light';
  const lang = settings?.lang ?? 'es';
  const t = i18n[lang] ?? i18n.es;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [budget, setBudgetState] = useState<number>(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [savingBudget, setSavingBudget] = useState(false);

  const styles = getStyles(theme);

  // Sync basic profile fields to local state (safe, no side-effects)
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

  // Load initial budget (from profile or from remote) but DO NOT call setContextBudget here.
  // We only set local UI state and cache; remote writes only happen when user explicitly saves.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) {
        setBudgetState(0);
        setBudgetInput('0.00');
        return;
      }
      try {
        if (profile && typeof profile.budget !== 'undefined' && profile.budget !== null) {
          const parsed = Number(profile.budget ?? 0);
          if (mounted) {
            setBudgetState(parsed);
            setBudgetInput(parsed.toFixed(2));
          }
        } else {
          // fallback: read from users table
          const b = await getUserBudget(userId);
          const parsed = Number(b ?? 0);
          if (mounted) {
            setBudgetState(parsed);
            setBudgetInput(parsed.toFixed(2));
          }
        }
      } catch (e) {
        console.warn('[ProfileScreen] load budget', e);
      }
    })();
    return () => {
      mounted = false;
    };
    // Important: only depend on userId and profile (not setContextBudget)
  }, [userId, profile]);

  // Save budget: use setContextBudget which will handle remote update & profile refresh internally.
  // We DO NOT call updateUserBudget directly here to avoid double calls.
  const onSaveBudget = async () => {
    if (!userId) return Alert.alert(t.error, t.notAuthed);

    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) return Alert.alert(t.error, t.invalidAmount);

    setSavingBudget(true);
    try {
      // Use the ExpensesContext's setBudget — it handles remote + local.
      await setContextBudget(Number(val));

      // update local UI state
      setBudgetState(Number(val));
      setEditingBudget(false);

      // Ask user whether to clear expenses (show ONE dialog)
      Alert.alert(
        t.done,
        t.clearExpensesQuestion,
        [
          { text: t.keep, style: 'cancel' },
          {
            text: t.delete,
            style: 'destructive',
            onPress: async () => {
              try {
                await clearAllExpenses(true);
                Alert.alert(t.done, t.deletedAllExpenses);
              } catch (err) {
                console.error('[ProfileScreen] clearAllExpenses', err);
                Alert.alert(t.error, 'No se pudieron eliminar los gastos.');
              }
            },
          },
        ],
      );
    } catch (err: any) {
      console.error('[ProfileScreen] updateBudget', err);
      Alert.alert(t.error, err?.message ?? t.error);
    } finally {
      setSavingBudget(false);
    }
  };

  const goToSettings = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof parent.navigate === 'function') {
      parent.navigate('Settings' as any);
    } else {
      try {
        navigation.navigate('Settings' as any);
      } catch (e) {
        console.error('[ProfileScreen] navigate to Settings', e);
        Alert.alert(t.error, 'No se pudo abrir Configuración. Revisa la navegación.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#fff' : '#1976d2'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t.name}</Text>
        <Text style={styles.value}>{name || t.noName}</Text>

        <Text style={styles.label}>{t.phone}</Text>
        <Text style={styles.value}>{phone || t.notRegistered}</Text>

        <Text style={styles.label}>{t.email}</Text>
        <Text style={styles.value}>{email || '...'}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>{t.budgetLabel}</Text>

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
              <Text style={styles.settingsText}>{t.editBudget}</Text>
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
              placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
            />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, marginRight: 8 }]}
                onPress={onSaveBudget}
                disabled={savingBudget}
              >
                <Text style={styles.saveButtonText}>{savingBudget ? `${t.save}...` : t.save}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => setEditingBudget(false)}
                disabled={savingBudget}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.settingsButton, { marginTop: 18 }]}
        onPress={goToSettings}
      >
        <Text style={styles.settingsText}>{t.openSettings}</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const dark = theme === 'dark';

  return StyleSheet.create({
    container: {
      padding: 16,
      flex: 1,
      backgroundColor: dark ? '#0d0d0d' : '#fff',
    },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? '#0d0d0d' : '#fff' },
    title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 20, color: dark ? '#fff' : '#111' },

    card: {
      backgroundColor: dark ? '#121212' : '#f7f7f7',
      padding: 16,
      borderRadius: 8,
      elevation: 2,
      borderWidth: dark ? 0 : 0,
    },
    label: {
      color: dark ? '#a8a8a8' : '#666',
      fontWeight: '600',
      marginTop: 10,
    },
    value: {
      fontSize: 16,
      color: dark ? '#fff' : '#222',
      marginTop: 2,
    },
    divider: { height: 1, backgroundColor: dark ? '#222' : '#eaeaea', marginVertical: 12 },
    settingsButton: {
      marginTop: 12,
      backgroundColor: dark ? '#1e1e1e' : '#fff',
      borderWidth: 1,
      borderColor: '#1976d2',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    settingsText: { color: '#1976d2', fontWeight: '700' },
    input: {
      borderWidth: 1,
      borderColor: dark ? '#333' : '#ddd',
      padding: 10,
      borderRadius: 6,
      backgroundColor: dark ? '#0d0d0d' : '#fff',
      color: dark ? '#fff' : '#000',
    },
    saveButton: {
      backgroundColor: '#1976d2',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonText: { color: '#fff', fontWeight: '700' },
    cancelButton: {
      backgroundColor: dark ? '#121212' : '#fff',
      borderWidth: 1,
      borderColor: dark ? '#333' : '#ddd',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: { color: '#1976d2', fontWeight: '700' },
  });
}
