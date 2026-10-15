import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { SocialConnectorsScreen } from '../screens/SocialConnectorsScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { AIScreen } from '../screens/AIScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type MoreStackParamList = {
  MoreMain: undefined;
  Social: undefined;
  Locations: undefined;
  AI: undefined;
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
        options={{ title: 'Settings & Connectors' }}
      />
      <Stack.Screen
        name="Social"
        component={SocialConnectorsScreen}
        options={{ title: 'Social Media Connectors' }}
      />
      <Stack.Screen
        name="Locations"
        component={LocationsScreen}
        options={{ title: 'Storefront Locations' }}
      />
      <Stack.Screen
        name="AI"
        component={AIScreen}
        options={{ title: 'Growth Strategy' }}
      />
      <Stack.Screen
        name="Team"
        component={TeamScreen}
        options={{ title: 'Team & Permissions' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Business & Preferences' }}
      />
    </Stack.Navigator>
  );
};
