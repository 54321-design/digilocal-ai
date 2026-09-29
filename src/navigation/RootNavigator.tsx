import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  Home,
  MessageCircle,
  Sparkles,
  FileText,
  Menu,
  Phone,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { WebAuditScreen } from '../screens/WebAuditScreen';
import { MoreStackNavigator } from './MoreStackNavigator';
import { useGoogle } from '../context/GoogleContext';
import { useAuth } from '../context/AuthContext';

export type RootTabParamList = {
  Home: undefined;
  Reviews: undefined;
  Posts: undefined;
  Audit: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppTopHeader: React.FC<{ onPressMenu?: () => void }> = ({ onPressMenu }) => {
  const { selectedLocation } = useGoogle();
  const { user } = useAuth();

  const businessTitle =
    selectedLocation?.title ||
    user?.displayName ||
    'DigiLocal Business Profile';

  const phoneOrEmail =
    selectedLocation?.phoneNumbers?.primaryPhone ||
    user?.email ||
    'GMB Connected';

  const initial = (businessTitle || 'D').trim().charAt(0).toUpperCase();

  return (
    <View
      style={{ backgroundColor: '#131A38' }}
      className="px-4 pt-11 pb-3.5 flex-row items-center justify-between"
    >
      <View className="flex-row items-center flex-1 mr-3">
        <Pressable onPress={onPressMenu} className="mr-3 p-1">
          <Menu size={22} color="#ffffff" />
        </Pressable>

        <View
          style={{
            borderColor: '#EC4899',
            borderWidth: 2,
            backgroundColor: '#1E2749',
          }}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
        >
          <Text className="text-white font-bold text-base">{initial}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>
            {businessTitle}
          </Text>
          <Text className="text-slate-300 text-[11px] mt-0.5" numberOfLines={1}>
            {phoneOrEmail} | v1.0.0
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => Linking.openURL('tel:+919310642066').catch(() => {})}
        style={{ backgroundColor: '#2A3252' }}
        className="flex-row items-center px-3.5 py-1.5 rounded-full"
      >
        <Phone size={12} color="#ffffff" />
        <Text className="text-white text-xs font-medium ml-1.5">Help</Text>
      </Pressable>
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          header: () => (
            <AppTopHeader onPressMenu={() => navigation.navigate('More')} />
          ),
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#131A38',
            borderTopWidth: 0,
            height: 66,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarItemStyle: {
            borderRadius: 16,
            marginHorizontal: 4,
          },
          tabBarActiveBackgroundColor: '#48326D',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{
            title: 'Review Replies',
            tabBarIcon: ({ color }) => <MessageCircle size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Posts"
          component={PostsScreen}
          options={{
            title: 'AI Post',
            tabBarIcon: ({ color }) => <Sparkles size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="Audit"
          component={WebAuditScreen}
          options={{
            title: 'Google Post',
            tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNavigator}
          options={{
            title: 'More',
            headerShown: false,
            tabBarIcon: ({ color }) => <Menu size={20} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
