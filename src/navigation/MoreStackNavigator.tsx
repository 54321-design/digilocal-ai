import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { POSScreen } from '../screens/POSScreen';
import { KhataScreen } from '../screens/KhataScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type MoreStackParamList = {
  MoreMain: undefined;
  POS: undefined;
  Khata: undefined;
  Customers: undefined;
  Inventory: undefined;
  Team: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export const MoreStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MoreMain"
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MoreMain"
        component={MoreScreen}
        options={{ title: 'More Modules' }}
      />
      <Stack.Screen
        name="POS"
        component={POSScreen}
        options={{ title: 'POS Sales Terminal' }}
      />
      <Stack.Screen
        name="Khata"
        component={KhataScreen}
        options={{ title: 'Khata Credit Ledger' }}
      />
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ title: 'Customer Directory' }}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Products & Inventory' }}
      />
      <Stack.Screen
        name="Team"
        component={TeamScreen}
        options={{ title: 'Team & Permissions' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Business & Settings' }}
      />
    </Stack.Navigator>
  );
};
