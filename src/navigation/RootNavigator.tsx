import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  Home,
  MapPin,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Menu,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { SEOScreen } from '../screens/SEOScreen';
import { AIScreen } from '../screens/AIScreen';
import { MoreStackNavigator } from './MoreStackNavigator';

export type RootTabParamList = {
  Home: undefined;
  Locations: undefined;
  Reviews: undefined;
  SEO: undefined;
  AI: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#f1f5f9',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 16,
            color: '#0f172a',
          },
          headerShadowVisible: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Locations"
          component={LocationsScreen}
          options={{
            title: 'Locations',
            tabBarIcon: ({ color, size }) => <MapPin size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{
            title: 'Reviews',
            tabBarIcon: ({ color, size }) => <MessageSquare size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="SEO"
          component={SEOScreen}
          options={{
            title: 'SEO',
            tabBarIcon: ({ color, size }) => <TrendingUp size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="AI"
          component={AIScreen}
          options={{
            title: 'AI Copilot',
            tabBarIcon: ({ color, size }) => <Sparkles size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNavigator}
          options={{
            title: 'More',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Menu size={size || 20} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
