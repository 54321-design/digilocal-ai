import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Building, Plus, Check, Shield, Globe, Info, MapPin } from 'lucide-react-native';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { Card, Button, Input, Modal, Badge } from '../components';

export const SettingsScreen: React.FC = () => {
  const { businesses, activeBusiness, selectBusiness, createBusiness } = useBusiness();
  const { user, accessToken, signInWithGoogle } = useAuth();
  const { locations, selectedLocation, selectLocation } = useGoogle();

  const [modalVisible, setModalVisible] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBusiness = async () => {
    if (!newBizName.trim()) {
      Alert.alert('Required', 'Please enter a name for the business.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createBusiness(newBizName.trim());
      setModalVisible(false);
      setNewBizName('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Google Business Profile Locations Switcher */}
      {locations.length > 0 && (
        <>
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Google Business Locations ({locations.length})
            </Text>
          </View>
          <Card className="p-0 bg-white border border-slate-200 overflow-hidden mb-5">
            {locations.map((loc, idx) => {
              const isActive = selectedLocation?.id === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => selectLocation(loc.id)}
                  className={`flex-row items-center justify-between p-4 active:bg-slate-50 ${
                    idx !== locations.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="p-2 bg-slate-100 rounded-xl mr-3">
                      <MapPin size={18} color="#131A38" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900">{loc.title}</Text>
                      <Text className="text-[11px] text-slate-500">
                        {loc.storefrontAddress?.locality ||
                          loc.categories?.primaryCategory?.displayName ||
                          loc.googleName}
                      </Text>
                    </View>
                  </View>
                  {isActive && (
                    <View className="p-1 bg-blue-100 rounded-full">
                      <Check size={14} color="#2563eb" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </Card>
        </>
      )}

      {/* Active Business Switcher */}
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Workspaces ({businesses.length})
        </Text>
        <Pressable onPress={() => setModalVisible(true)}>
          <Text className="text-xs font-semibold text-blue-600">+ New Workspace</Text>
        </Pressable>
      </View>

      <Card className="p-0 bg-white border border-slate-200 overflow-hidden mb-5">
        {businesses.map((biz, idx) => {
          const isActive = activeBusiness?.id === biz.id;
          return (
            <Pressable
              key={biz.id}
              onPress={() => selectBusiness(biz.id)}
              className={`flex-row items-center justify-between p-4 active:bg-slate-50 ${
                idx !== businesses.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="p-2 bg-slate-100 rounded-xl mr-3">
                  <Building size={18} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">{biz.name}</Text>
                  <Text className="text-[11px] text-slate-400">ID: {biz.id}</Text>
                </View>
              </View>
              {isActive && (
                <View className="p-1 bg-blue-100 rounded-full">
                  <Check size={14} color="#2563eb" />
                </View>
              )}
            </Pressable>
          );
        })}
      </Card>

      {/* Google Integration Status */}
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
        Google Integration
      </Text>
      <Card className="p-4 bg-white border border-slate-200 mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-bold text-slate-900">Google OAuth Session</Text>
          <Badge
            label={accessToken ? 'Connected' : 'Disconnected'}
            variant={accessToken ? 'success' : 'danger'}
          />
        </View>
        <Text className="text-xs text-slate-500 mb-3">
          {accessToken
            ? 'Access token is active. Google Business Profile endpoints can be queried.'
            : 'Sign in with Google to grant permission to read locations and reviews.'}
        </Text>
        {!accessToken && (
          <Button title="Connect Google" onPress={signInWithGoogle} size="sm" variant="outline" />
        )}
      </Card>

      {/* App Environment Info */}
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
        About DigiLocal.ai
      </Text>
      <Card className="p-4 bg-white border border-slate-200">
        <View className="flex-row items-center mb-2">
          <Info size={16} color="#64748b" className="mr-2" />
          <Text className="text-xs font-bold text-slate-800">DigiLocal Mobile v1.0.0</Text>
        </View>
        <Text className="text-xs text-slate-500 leading-relaxed">
          The SaaS platform for local business growth, powered by Google Business Profile,
          Maps visibility, and Gemini AI.
        </Text>
      </Card>

      {/* Create Business Modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Create New Business"
      >
        <Input
          label="Business Name"
          value={newBizName}
          onChangeText={setNewBizName}
          placeholder="e.g. Acme Supermart"
        />
        <Button
          title="Create Business"
          onPress={handleCreateBusiness}
          loading={isSubmitting}
          variant="primary"
        />
      </Modal>
    </ScrollView>
  );
};
