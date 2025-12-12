// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExpenses } from '../context/ExpensesContext';
import { signOutUser } from '../services/supabase';
import { useSettings } from '../context/SettingsContext';
import { useNavigation } from '@react-navigation/native';

/**
 * SettingsScreen
 * - Controla tema, idioma y moneda desde SettingsContext
 * - Acciones: sincronizar, limpiar caché local, eliminar del servidor, cerrar sesión
 * - Usa activeTheme desde SettingsContext para colores (light/dark)
 */
export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { refresh, clearAllExpenses } = useExpenses();
  const settings = useSettings();

  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);

  // si no hay contexto (no debería pasar) mostramos loader
  if (!settings) {
    return (
      <SafeAreaView style={localStyles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  // destructuramos lo necesario del contexto
  const { theme, setTheme, lang, setLang, currency, setCurrency, loading: settingsLoading, activeTheme } = settings;

  // traducción simple
  const t = (es: string, en: string) => (lang === 'es' ? es : en);

  // Colores desde theme activo
  const colors = {
    bg: activeTheme?.background ?? '#fff',
    card: activeTheme?.card ?? '#fff',
    text: activeTheme?.text ?? '#000',
    primary: activeTheme?.primary ?? '#1976d2',
    border: activeTheme?.border ?? '#ddd',
    danger: '#d32f2f',
  };

  const goBack = () => navigation.goBack();

  // Cerrar sesión con reset seguro de navegación
  const onSignOut = () => {
    Alert.alert(t('Cerrar sesión', 'Sign out'), t('¿Deseas cerrar sesión?', 'Do you want to sign out?'), [
      { text: t('Cancelar', 'Cancel'), style: 'cancel' },
      {
        text: t('Cerrar sesión', 'Sign out'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
            // reset de navegación al stack de login
            const parent = navigation.getParent?.();
            if (parent?.reset) {
              parent.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          } catch (err) {
            console.error(err);
            Alert.alert(t('Error', 'Error'), t('No se pudo cerrar sesión.', 'Could not sign out.'));
          }
        },
      },
    ]);
  };

  // Sincronizar (traer gastos del servidor)
  const onSyncNow = async () => {
    setLoadingSync(true);
    try {
      await refresh();
      Alert.alert(t('Éxito', 'Success'), t('Sincronizado correctamente', 'Synced successfully'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('Error', 'Error'), t('No se pudo sincronizar', 'Could not sync'));
    } finally {
      setLoadingSync(false);
    }
  };

  // Limpiar caché local
  const onClearCache = () => {
    Alert.alert(
      t('Limpiar caché', 'Clear cache'),
      t('Esto borrará los datos locales pero NO el servidor.', 'This will remove local cache but NOT server data.'),
      [
        { text: t('Cancelar', 'Cancel'), style: 'cancel' },
        {
          text: t('Eliminar', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            setLoadingClear(true);
            try {
              await AsyncStorage.removeItem('@expenses');
              await AsyncStorage.removeItem('@budget');
              Alert.alert(t('Listo', 'Done'), t('Caché local eliminado.', 'Local cache cleared.'));
            } catch (e) {
              console.error(e);
              Alert.alert(t('Error', 'Error'), t('No se pudo limpiar caché.', 'Could not clear cache.'));
            } finally {
              setLoadingClear(false);
            }
          },
        },
      ]
    );
  };

  // Eliminar todos los gastos en el servidor
  const onDeleteRemote = () => {
    Alert.alert(
      t('Eliminar (servidor)', 'Delete (server)'),
      t('Esto eliminará TODOS tus gastos en Supabase', 'This will delete ALL your expenses on Supabase'),
      [
        { text: t('Cancelar', 'Cancel'), style: 'cancel' },
        {
          text: t('Eliminar', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllExpenses(true);
              Alert.alert(t('Hecho', 'Done'), t('Gastos eliminados del servidor.', 'Expenses deleted from server.'));
            } catch (e) {
              console.error(e);
              Alert.alert(t('Error', 'Error'), t('No se pudo eliminar en el servidor.', 'Could not delete on server.'));
            }
          },
        },
      ]
    );
  };

  if (settingsLoading) {
    return (
      <SafeAreaView style={[localStyles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[localStyles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={[localStyles.container]}>
        {/* Header */}
        <View style={localStyles.headerRow}>
          <TouchableOpacity onPress={goBack}>
            <Text style={[localStyles.back, { color: colors.primary }]}>{'← ' + t('Volver', 'Back')}</Text>
          </TouchableOpacity>

          <Text style={[localStyles.header, { color: colors.text }]}>{t('Configuración', 'Settings')}</Text>

          <View style={{ width: 60 }} />
        </View>

        {/* Tema */}
        <View style={localStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[localStyles.label, { color: colors.text }]}>{t('Tema oscuro', 'Dark theme')}</Text>
            <Text style={{ color: colors.text, marginTop: 4, fontSize: 12 }}>{t('Activa para usar tema oscuro en la app', 'Enable dark theme')}</Text>
          </View>

          <Switch
            value={theme === 'dark'}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
            thumbColor={theme === 'dark' ? colors.primary : undefined}
          />
        </View>

        {/* Idioma */}
        <View style={localStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[localStyles.label, { color: colors.text }]}>{t('Idioma', 'Language')}</Text>
            <Text style={{ color: colors.text, marginTop: 4, fontSize: 12 }}>{t('Selecciona el idioma de la interfaz', 'Select UI language')}</Text>
          </View>

          <View style={localStyles.rowButtons}>
            <TouchableOpacity
              onPress={() => setLang('es')}
              style={[localStyles.chip, lang === 'es' ? localStyles.chipActive : null, { marginRight: 8 }]}
            >
              <Text style={lang === 'es' ? localStyles.chipTextActive : localStyles.chipText}>ES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLang('en')}
              style={[localStyles.chip, lang === 'en' ? localStyles.chipActive : null]}
            >
              <Text style={lang === 'en' ? localStyles.chipTextActive : localStyles.chipText}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Moneda */}
        <View style={localStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[localStyles.label, { color: colors.text }]}>{t('Moneda por defecto', 'Default currency')}</Text>
            <Text style={{ color: colors.text, marginTop: 4, fontSize: 12 }}>{t('Mostrar montos en esta moneda', 'Show amounts in this currency')}</Text>
          </View>

          <View style={localStyles.rowButtons}>
            <TouchableOpacity
              onPress={() => setCurrency('HNL')}
              style={[localStyles.chip, currency === 'HNL' ? localStyles.chipActive : null, { marginRight: 8 }]}
            >
              <Text style={currency === 'HNL' ? localStyles.chipTextActive : localStyles.chipText}>HNL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrency('USD')}
              style={[localStyles.chip, currency === 'USD' ? localStyles.chipActive : null]}
            >
              <Text style={currency === 'USD' ? localStyles.chipTextActive : localStyles.chipText}>USD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTONES */}
        <TouchableOpacity style={[localStyles.btnPrimary, { backgroundColor: colors.primary }]} onPress={onSyncNow}>
          {loadingSync ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.btnText}>{t('Sincronizar ahora', 'Sync now')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[localStyles.btnPrimary, { backgroundColor: colors.primary }]} onPress={onClearCache}>
          {loadingClear ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.btnText}>{t('Limpiar caché local', 'Clear local cache')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[localStyles.btnDanger, { borderColor: colors.danger }]} onPress={onDeleteRemote}>
          <Text style={[localStyles.btnDangerText, { color: colors.danger }]}>{t('Eliminar todos mis gastos (servidor)', 'Delete all my expenses (server)')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[localStyles.btnOutline, { borderColor: colors.primary }]} onPress={onSignOut}>
          <Text style={[localStyles.btnOutlineText, { color: colors.primary }]}>{t('Cerrar sesión', 'Sign out')}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  back: { fontSize: 16, fontWeight: '700' },
  header: { fontSize: 22, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  label: { fontSize: 16, fontWeight: '600' },

  rowButtons: { flexDirection: 'row', alignItems: 'center' },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e5e5e5',
  },
  chipActive: {
    backgroundColor: '#1976d2',
  },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  btnPrimary: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontWeight: '700' },

  btnDanger: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  btnDangerText: { fontWeight: '700' },

  btnOutline: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  btnOutlineText: { fontWeight: '700' },
});
