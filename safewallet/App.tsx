// App.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDark } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ExpensesProvider } from './src/context/ExpensesContext';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';

function AppWithTheme() {
  const { theme } = useSettings();

  const navTheme = theme === "dark" ? NavDark : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ExpensesProvider>
          <AppWithTheme />
        </ExpensesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
