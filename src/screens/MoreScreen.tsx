import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import {
  CreditCard,
  BookOpen,
  Users,
  Package,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
  Building,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { useOffline } from '../context/OfflineContext';
import { Card, Badge, Avatar } from '../components';

interface MoreScreenProps {
  navigation: any;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { activeBusiness, currentRole } = useBusiness();
  const { isOnline, pendingMutations, processQueue } = useOffline();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuSections = [
    {
      title: 'Supporting Commerce Modules',
      items: [
        {
          title: 'POS Terminal',
          subtitle: 'Create sales and customer receipts',
          icon: <CreditCard size={18} color="#2563eb" />,
          screen: 'POS',
        },
        {
          title: 'Khata / Credit Ledger',
          subtitle: 'Track customer udhaar and payments',
          icon: <BookOpen size={18} color="#059669" />,
          screen: 'Khata',
        },
        {
          title: 'Customer Directory',
          subtitle: 'Customer contact book and ledger balances',
          icon: <Users size={18} color="#d97706" />,
          screen: 'Customers',
        },
        {
          title: 'Products & Inventory',
          subtitle: 'Manage items, catalog pricing, and stock',
          icon: <Package size={18} color="#7c3aed" />,
          screen: 'Inventory',
        },
      ],
    },
    {
      title: 'Multi-Tenant SaaS & Team',
      items: [
        {
          title: 'Team & Members',
          subtitle: 'Manage roles (Owner, Admin, Manager, Staff)',
          icon: <Shield size={18} color="#2563eb" />,
          screen: 'Team',
        },
        {
          title: 'Business Profiles',
          subtitle: activeBusiness ? activeBusiness.name : 'Switch or add business',
          icon: <Building size={18} color="#475569" />,
          screen: 'Settings',
        },
      ],
    },
    {
      title: 'System & Connectivity',
      items: [
        {
          title: 'Sync Status',
          subtitle: isOnline
            ? pendingMutations.length > 0
              ? `${pendingMutations.length} pending mutations`
              : 'All records synced'
            : 'Working offline',
          icon: <Wifi size={18} color={isOnline ? '#10b981' : '#f59e0b'} />,
          onPress: processQueue,
        },
        {
          title: 'App Settings & Environment',
          subtitle: 'DigiLocal.ai v1.0.0',
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
        <Card className="p-4 bg-white border border-slate-200 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
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
          <Card className="p-0 bg-white border border-slate-200 overflow-hidden">
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
