import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Shield, UserCheck, Mail } from 'lucide-react-native';
import { useBusiness } from '../context/BusinessContext';
import { Card, Badge, Avatar } from '../components';

export const TeamScreen: React.FC = () => {
  const { activeBusiness, members, currentRole } = useBusiness();

  const roleColors: Record<string, 'primary' | 'success' | 'warning' | 'neutral'> = {
    owner: 'primary',
    admin: 'success',
    manager: 'warning',
    staff: 'neutral',
  };

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <Card className="p-4 bg-white border border-slate-200 mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Active Business Tenant
        </Text>
        <Text className="text-base font-bold text-slate-900">{activeBusiness?.name}</Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          Tenant ID: {activeBusiness?.id} • Your Role: {currentRole.toUpperCase()}
        </Text>
      </Card>

      <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
        Organization Members
      </Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <Card className="mb-2.5 p-3.5 bg-white border border-slate-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Avatar name={item.displayName} size="sm" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-slate-900">{item.displayName}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Mail size={11} color="#64748b" className="mr-1" />
                    <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>
                </View>
              </View>

              <Badge
                label={item.role.toUpperCase()}
                variant={roleColors[item.role] || 'neutral'}
                size="sm"
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
};
