// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExpenses } from '../context/ExpensesContext';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/supabase';


const THEME_KEY = '@settings_theme'; // 'light' | 'dark'
const LANG_KEY = '@settings_lang'; // 'es' | 'en'
const CURRENCY_KEY = '@settings_currency'; // 'HNL' | 'USD'

export default function SettingsScreen() {
  const { refresh, clearAllExpenses } = useExpenses();
  const { sessionUser } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [currency, setCurrency] = useState<'HNL' | 'USD'>('HNL');
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(THEME_KEY);
        const l = await AsyncStorage.getItem(LANG_KEY);
        const c = await AsyncStorage.getItem(CURRENCY_KEY);
        if (t) setIsDark(t === 'dark');
        if (l === 'en' || l === 'es') setLang(l);
        if (c === 'USD' || c === 'HNL') setCurrency(c);
      } catch (e) {
        console.warn('[Settings] load prefs', e);
      }
    })();
  }, []);

  const onToggleTheme = async (val: boolean) => {
    setIsDark(val);
    try {
      await AsyncStorage.setItem(THEME_KEY, val ? 'dark' : 'light');
    } catch (e) {
      console.warn('[Settings] save theme', e);
    }
  };

  const onChangeLang = async (newLang: 'es' | 'en') => {
    setLang(newLang);
    try {
      await AsyncStorage.setItem(LANG_KEY, newLang);
    } catch (e) {
      console.warn('[Settings] save lang', e);
    }
  };

  const onChangeCurrency = async (newCur: 'HNL' | 'USD') => {
    setCurrency(newCur);
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, newCur);
      // Nota: SummaryScreen debe leer esta key para mostrar conversión adecuada
    } catch (e) {
      console.warn('[Settings] save currency', e);
    }
  };

  const onSyncNow = async () => {
    setLoadingSync(true);
    try {
      await refresh();
      Alert.alert('Listo', 'Sincronización completada.');
    } catch (e) {
      console.error('[Settings] sync', e);
      Alert.alert('Error', 'No se pudo sincronizar. Revisa la consola.');
    } finally {
      setLoadingSync(false);
    }
  };

  const onClearCache = async () => {
    Alert.alert(
      'Limpiar caché',
      'Esto eliminará los datos locales (gastos y presupuesto) pero no borrará la base de datos remota. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoadingClear(true);
            try {
              await AsyncStorage.removeItem('@expenses');
              await AsyncStorage.removeItem('@budget');
              Alert.alert('Listo', 'Datos locales eliminados.');
            } catch (e) {
              console.error('[Settings] clear cache', e);
              Alert.alert('Error', 'No se pudo limpiar caché.');
            } finally {
              setLoadingClear(false);
            }
          },
        },
      ]
    );
  };

  const onDeleteRemote = async () => {
    if (!sessionUser?.id) {
      return Alert.alert('Error', 'Usuario no autenticado.');
    }
    Alert.alert(
      'Eliminar gastos (remoto)',
      'Esto eliminará TODOS tus gastos en el servidor. Esta acción es irreversible. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllExpenses(true); // borra remoto + local
              Alert.alert('Listo', 'Gastos eliminados del servidor y localmente.');
            } catch (e) {
              console.error('[Settings] delete remote', e);
              Alert.alert('Error', 'No se pudieron eliminar los gastos en el servidor.');
            }
          },
        },
      ]
    );
  };

  // Sign out
  const onSignOut = async () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } catch (e) {
            console.error('[Settings] signOut', e);
            Alert.alert('Error', 'No se pudo cerrar sesión.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Configuración</Text>

      {/* Theme */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Tema oscuro</Text>
          <Text style={styles.small}>Activa para usar tema oscuro en la app</Text>
        </View>
        <Switch value={isDark} onValueChange={onToggleTheme} />
      </View>

      {/* Language */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Idioma</Text>
          <Text style={styles.small}>Selecciona el idioma de la interfaz</Text>
        </View>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.chip, lang === 'es' ? styles.chipActive : null]}
            onPress={() => onChangeLang('es')}
          >
            <Text style={lang === 'es' ? styles.chipTextActive : styles.chipText}>ES</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, lang === 'en' ? styles.chipActive : null]}
            onPress={() => onChangeLang('en')}
          >
            <Text style={lang === 'en' ? styles.chipTextActive : styles.chipText}>EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Moneda por defecto</Text>
          <Text style={styles.small}>Mostrar montos en esta moneda</Text>
        </View>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.chip, currency === 'HNL' ? styles.chipActive : null]}
            onPress={() => onChangeCurrency('HNL')}
          >
            <Text style={currency === 'HNL' ? styles.chipTextActive : styles.chipText}>HNL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, currency === 'USD' ? styles.chipActive : null]}
            onPress={() => onChangeCurrency('USD')}
          >
            <Text style={currency === 'USD' ? styles.chipTextActive : styles.chipText}>USD</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={{ marginTop: 18 }}>
        <TouchableOpacity style={styles.action} onPress={onSyncNow} disabled={loadingSync}>
          {loadingSync ? <ActivityIndicator /> : <Text style={styles.actionText}>Sincronizar ahora</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onClearCache} disabled={loadingClear}>
          {loadingClear ? <ActivityIndicator /> : <Text style={styles.actionText}>Limpiar caché local</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d32f2f' }]} onPress={onDeleteRemote}>
          <Text style={[styles.actionText, { color: '#d32f2f' }]}>Eliminar todos mis gastos (servidor)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.action, { marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#1976d2' }]} onPress={onSignOut}>
          <Text style={[styles.actionText, { color: '#1976d2' }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.label}>Acerca de</Text>
        <Text style={styles.small}>WalletApp - Proyecto académico</Text>
        <Text style={styles.small}>Versión: 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontWeight: '700' },
  small: { color: '#666', marginTop: 4 },
  langRow: { flexDirection: 'row' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    marginLeft: 8,
  },
  chipActive: {
    backgroundColor: '#1976d2',
  },
  chipText: { color: '#333', fontWeight: '700' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  action: {
    marginTop: 10,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700' },
});
