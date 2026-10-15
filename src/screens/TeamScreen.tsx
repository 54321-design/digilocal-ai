import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  UserCheck,
  Mail,
  UserPlus,
  Trash2,
  Lock,
  X,
  CheckCircle,
  Building2,
} from 'lucide-react-native';
import { useBusiness } from '../context/BusinessContext';
import { UserRole } from '../types';

export const TeamScreen: React.FC = () => {
  const { activeBusiness, members, currentRole, addMember, removeMember } = useBusiness();

  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    owner: { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800' },
    admin: { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800' },
    manager: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800' },
    staff: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700' },
  };

  const handleInviteEmployee = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid employee email address.');
      return;
    }
    if (!inviteName.trim()) {
      Alert.alert('Name Required', 'Please enter employee display name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMember(inviteEmail.trim(), inviteName.trim(), selectedRole);
      Alert.alert(
        'Access Granted!',
        `${inviteName} (${inviteEmail}) has been authorized as a ${selectedRole.toUpperCase()} for ${activeBusiness?.name}. They can now log in to manage your posts and reviews.`
      );
      setInviteEmail('');
      setInviteName('');
      setIsInviteModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not grant access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = (memberId: string, memberName: string) => {
    Alert.alert(
      'Revoke Employee Access?',
      `Are you sure you want to remove ${memberName}? They will immediately lose access to all ${activeBusiness?.name} data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            await removeMember(memberId);
            Alert.alert('Access Revoked', `${memberName} has been removed.`);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-950 p-4">
      {/* 1. Tenant Isolation & Active Business Header */}
      <View className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Building2 size={16} color="#6366f1" />
            <Text className="text-xs font-bold uppercase tracking-wider text-indigo-400 ml-1.5">
              Active Business Tenant
            </Text>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/50 flex-row items-center">
            <Lock size={10} color="#34d399" />
            <Text className="text-[10px] font-bold text-emerald-400 ml-1">ISOLATED</Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-white">{activeBusiness?.name || 'My Business'}</Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Tenant ID: {activeBusiness?.id} • Your Role: <Text className="text-indigo-400 font-bold">{currentRole.toUpperCase()}</Text>
        </Text>
        
        {/* Security Notice */}
        <View className="mt-3 pt-2.5 border-t border-slate-800/80 flex-row items-center">
          <Shield size={13} color="#94a3b8" />
          <Text className="text-[11px] text-slate-400 ml-1.5 flex-1">
            Data Isolation Active: Only authorized employees below can view or manage this business's posts and reviews.
          </Text>
        </View>
      </View>

      {/* 2. Employee List Header + Add Employee Button */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Authorized Team Members ({members.length})
        </Text>
        {currentRole === 'owner' || currentRole === 'admin' ? (
          <Pressable
            onPress={() => setIsInviteModalVisible(true)}
            className="flex-row items-center px-3 py-1.5 rounded-xl bg-indigo-600 active:bg-indigo-700"
          >
            <UserPlus size={13} color="#ffffff" />
            <Text className="text-xs font-bold text-white ml-1.5">Authorize Employee</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 3. Members List */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => {
          const colors = roleColors[item.role] || roleColors.staff;
          const isOwner = item.role === 'owner';

          return (
            <View className="mb-2.5 p-3.5 bg-slate-900 border border-slate-800/90 rounded-2xl flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 items-center justify-center">
                  <Text className="text-sm font-bold text-white">
                    {(item.displayName || item.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-white">{item.displayName || 'Team Member'}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Mail size={11} color="#64748b" />
                    <Text className="text-xs text-slate-400 ml-1" numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View className={`px-2.5 py-1 rounded-full border ${colors.bg} ${colors.border}`}>
                  <Text className={`text-[11px] font-bold ${colors.text}`}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>

                {!isOwner && (currentRole === 'owner' || currentRole === 'admin') ? (
                  <Pressable
                    onPress={() => handleRevokeAccess(item.userId, item.displayName || item.email)}
                    className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/40 active:bg-red-900/60 ml-1"
                  >
                    <Trash2 size={13} color="#f87171" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {/* 4. Authorize Employee Modal */}
      <Modal
        visible={isInviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <View className="flex-row items-center">
                <Shield size={18} color="#6366f1" />
                <Text className="text-base font-bold text-white ml-2">Authorize Employee</Text>
              </View>
              <Pressable
                onPress={() => setIsInviteModalVisible(false)}
                className="p-1 rounded-full bg-slate-800"
              >
                <X size={16} color="#94a3b8" />
              </Pressable>
            </View>

            <Text className="text-xs text-slate-400 mb-4">
              Grant staff or store manager access to <Text className="text-white font-bold">{activeBusiness?.name}</Text>. They will be able to see and manage scheduled posts.
            </Text>

            {/* Name Input */}
            <Text className="text-xs font-semibold text-slate-300 mb-1">Employee Name</Text>
            <TextInput
              value={inviteName}
              onChangeText={setInviteName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#64748b"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm mb-3"
            />

            {/* Email Input */}
            <Text className="text-xs font-semibold text-slate-300 mb-1">Employee Email Address</Text>
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="e.g. rahul@business.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm mb-3"
            />

            {/* Role Selector */}
            <Text className="text-xs font-semibold text-slate-300 mb-1.5">Assign Access Role</Text>
            <View className="flex-row gap-2 mb-4">
              {(['manager', 'staff', 'admin'] as UserRole[]).map((r) => {
                const isSelected = selectedRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedRole(r)}
                    className={`flex-1 py-2 px-1 rounded-xl items-center border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {r === 'manager' ? 'Manager' : r === 'staff' ? 'Staff' : 'Admin'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Role description */}
            <Text className="text-[11px] text-slate-400 mb-4 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              {selectedRole === 'manager'
                ? 'Manager: Create, edit, and schedule posts, and reply to Google reviews.'
                : selectedRole === 'staff'
                ? 'Staff: View posts, share updates to WhatsApp, and monitor reviews.'
                : 'Admin: Full access to business settings, members, and connected channels.'}
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setIsInviteModalVisible(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 items-center"
              >
                <Text className="text-xs font-semibold text-slate-300">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleInviteEmployee}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 active:bg-indigo-700 items-center justify-center flex-row"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <UserCheck size={14} color="#ffffff" />
                    <Text className="text-xs font-bold text-white ml-1.5">Grant Access</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
