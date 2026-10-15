import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import {
  Share2,
  MapPin,
  Sparkles,
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
  Building,
  Radio,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { useOffline } from '../context/OfflineContext';
import { useSocial } from '../context/SocialContext';
import { useGoogle } from '../context/GoogleContext';
import { Card, Badge, Avatar } from '../components';

interface MoreScreenProps {
  navigation: any;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { activeBusiness, currentRole } = useBusiness();
  const { isOnline, pendingMutations, processQueue } = useOffline();
  const { connectedCount } = useSocial();
  const { locations, selectedLocation } = useGoogle();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuSections = [
    {
      title: 'Omnichannel & Multi-Location',
      items: [
        {
          title: 'Social Media Connectors',
          subtitle: `${connectedCount} of 3 active (Instagram, Facebook, LinkedIn)`,
          icon: <Share2 size={18} color="#8b5cf6" />,
          screen: 'Social',
        },
        {
          title: 'Storefront Locations Hub',
          subtitle: `${locations.length} ${locations.length === 1 ? 'branch' : 'branches'} managed across Google Maps`,
          icon: <MapPin size={18} color="#2563eb" />,
          screen: 'Locations',
        },
        {
          title: 'Growth Strategy',
          subtitle: 'Weekly action roadmap and local SEO recommendations',
          icon: <TrendingUp size={18} color="#2563eb" />,
          screen: 'AI',
        },
      ],
    },
    {
      title: 'Organization & Team',
      items: [
        {
          title: 'Team & Permissions',
          subtitle: 'Manage roles (Owner, Admin, Manager, Staff)',
          icon: <Shield size={18} color="#2563eb" />,
          screen: 'Team',
        },
        {
          title: 'Business Profiles',
          subtitle: selectedLocation?.title || activeBusiness?.name || 'Switch or add business',
          icon: <Building size={18} color="#475569" />,
          screen: 'Settings',
        },
      ],
    },
    {
      title: 'Backend & Infrastructure',
      items: [
        {
          title: 'Publishing Webhook',
          subtitle: 'Connected for automated post publishing',
          icon: <Radio size={18} color="#10b981" />,
          screen: 'Social',
        },
        {
          title: 'Sync Status & Offline Cache',
          subtitle: isOnline
            ? pendingMutations.length > 0
              ? `${pendingMutations.length} pending mutations`
              : 'All records synced'
            : 'Working offline',
          icon: <Wifi size={18} color={isOnline ? '#10b981' : '#f59e0b'} />,
          onPress: processQueue,
        },
        {
          title: 'App Settings & Preferences',
          subtitle: 'DigiLocal Business Suite v1.0',
          icon: <Settings size={18} color="#64748b" />,
          screen: 'Settings',
        },
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* User Info Header Card */}
      {user && (
        <Card className="p-4 bg-white border border-slate-200 mb-4 flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center flex-1 mr-2">
            <Avatar name={user.displayName} photoUrl={user.photoURL} size="md" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                {user.displayName}
              </Text>
              <Text className="text-xs text-slate-500" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
          <Badge label={currentRole.toUpperCase()} variant="primary" size="sm" />
        </Card>
      )}

      {/* Menu List */}
      {menuSections.map((sec, sIdx) => (
        <View key={sIdx} className="mb-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            {sec.title}
          </Text>
          <Card className="p-0 bg-white border border-slate-200 overflow-hidden shadow-xs">
            {sec.items.map((item, iIdx) => (
              <Pressable
                key={iIdx}
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  } else if (item.screen) {
                    navigation.navigate(item.screen);
                  }
                }}
                className={`flex-row items-center justify-between p-4 active:bg-slate-50 ${
                  iIdx !== sec.items.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="p-2 bg-slate-50 rounded-xl mr-3">{item.icon}</View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{item.title}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      {/* Sign Out Action */}
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center justify-center p-3.5 bg-red-50 border border-red-200 rounded-xl active:bg-red-100 mt-2"
      >
        <LogOut size={16} color="#dc2626" className="mr-2" />
        <Text className="text-xs font-bold text-red-700">Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
};
