import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import SummaryScreen from '../screens/SummaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { RootStackParamList, TabParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MissingScreen({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Pantalla no encontrada</Text>
      <Text style={{ color: '#666' }}>{`La pantalla "${name}" no está disponible. Revisa la importación.`}</Text>
    </View>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { height: 60, paddingBottom: 6 },
        tabBarIcon: ({ focused, size, color }) => {
          let iconName: any = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'AddExpense') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Summary') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen ?? (() => <MissingScreen name="Home" />)} options={{ title: 'Inicio' }} />
      <Tab.Screen name="AddExpense" component={AddExpenseScreen ?? (() => <MissingScreen name="AddExpense" />)} options={{ title: 'Agregar' }} />
      <Tab.Screen name="Summary" component={SummaryScreen ?? (() => <MissingScreen name="Summary" />)} options={{ title: 'Resumen' }} />
      <Tab.Screen name="Profile" component={ProfileScreen ?? (() => <MissingScreen name="Profile" />)} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen ?? (() => <MissingScreen name="Login" />)} />
      <Stack.Screen name="Register" component={RegisterScreen ?? (() => <MissingScreen name="Register" />)} />
      <Stack.Screen name="AppTabs" component={AppTabs} />
      {/* Settings está en el Stack: se mostrará encima de las tabs cuando se navegue a ella */}
      <Stack.Screen name="Settings" component={SettingsScreen ?? (() => <MissingScreen name="Settings" />)} />
    </Stack.Navigator>
  );
}
