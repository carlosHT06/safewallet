import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ExpensesProvider } from './src/context/ExpensesContext';
import { AuthProvider } from './src/context/AuthContext'; 

export default function App() {
  return (
    <AuthProvider>
      <ExpensesProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ExpensesProvider>
    </AuthProvider>
  );
}
