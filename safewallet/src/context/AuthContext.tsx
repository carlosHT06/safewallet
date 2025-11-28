import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import {
  getUserById,
  saveProfileToStorage,
  loadProfileFromStorage,
} from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Profile = {
  id: string;
  email?: string;
  name?: string | null;
  phone?: string | null;
  [key: string]: any;
};

type AuthContextValue = {
  sessionUser: any | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // actualizar profile + storage
  const setProfileAndStore = async (p: Profile | null) => {
    setProfile(p);
    try {
      if (p) {
        await AsyncStorage.setItem('@user_profile', JSON.stringify(p));
      } else {
        await AsyncStorage.removeItem('@user_profile');
      }
    } catch (e) {
      console.warn('[AuthProvider] storage error', e);
    }
  };

  const fetchProfileFromDb = async (id: string | null | undefined) => {
    if (!id) return null;

    try {
      const p = await getUserById(id);
      return p;
    } catch (e) {
      console.warn('[AuthProvider] fetchProfile error', e);
      return null;
    }
  };

  // función pública para refrescar perfil
  const refreshProfile = async () => {
    setLoading(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const user = sessionRes?.data?.session?.user ?? null;

      setSessionUser(user);

      if (user) {
        const p = await fetchProfileFromDb(user.id);
        await setProfileAndStore(p);
      } else {
        const local = await loadProfileFromStorage();
        setProfile(local);
      }
    } catch (e) {
      console.warn('[AuthProvider] refreshProfile error', e);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await setProfileAndStore(null);
      setSessionUser(null);
    } catch (e) {
      console.warn('[AuthProvider] signOut error', e);
    }
  };

  // inicialización
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const sessionRes = await supabase.auth.getSession();
        const user = sessionRes?.data?.session?.user ?? null;

        if (!mounted) return;

        setSessionUser(user);

        if (user) {
          const p = await fetchProfileFromDb(user.id);
          await setProfileAndStore(p);
        } else {
          const local = await loadProfileFromStorage();
          setProfile(local);
        }
      } catch (e) {
        console.warn('[AuthProvider] init error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // escuchar cambios del auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const eventStr = String(event);
      console.log('[AuthProvider] event:', eventStr);

      const user = session?.user ?? null;
      setSessionUser(user);

      switch (eventStr) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESH':
          if (user) {
            const p = await fetchProfileFromDb(user.id);
            await setProfileAndStore(p);
          }
          break;

        case 'SIGNED_OUT':
          await setProfileAndStore(null);
          break;

        default:
          break;
      }
    });

    return () => {
      mounted = false;
      try {
        // @ts-ignore
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        sessionUser,
        profile,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
