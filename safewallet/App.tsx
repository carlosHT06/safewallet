// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

import { Provider } from 'react-redux';
import { store } from './src/store/store';



export default function App() {
  return (
    <Provider store={store}>
      {/* <ExpensesProvider>  // si aún lo usas */}
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      {/* </ExpensesProvider> */}
      <StatusBar style="auto" />
    </Provider>
  );
}
