import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  Home,
  Calendar,
  MessageSquare,
  Globe,
  Menu,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { WebAuditScreen } from '../screens/WebAuditScreen';
import { MoreStackNavigator } from './MoreStackNavigator';

export type RootTabParamList = {
  Home: undefined;
  Posts: undefined;
  Reviews: undefined;
  Audit: undefined;
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
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Posts"
          component={PostsScreen}
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size }) => <Calendar size={size || 20} color={color} />,
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
          name="Audit"
          component={WebAuditScreen}
          options={{
            title: 'Web Audit',
            tabBarIcon: ({ color, size }) => <Globe size={size || 20} color={color} />,
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
