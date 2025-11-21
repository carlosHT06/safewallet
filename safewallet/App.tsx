import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ExpensesProvider } from './src/context/ExpensesContext';

export default function App() {
  return (
    <ExpensesProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ExpensesProvider>
  );
}
