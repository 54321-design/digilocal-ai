import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Share2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Layers,
  Radio,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import { useSocial } from '../context/SocialContext';
import { usePosts } from '../context/PostsContext';
import { Card, Badge, Button } from '../components';
import { SocialConnector } from '../types';

export const SocialConnectorsScreen: React.FC = () => {
  const { connectors, toggleAutoCrossPost, connectAccount, disconnectAccount, connectedCount } =
    useSocial();
  const { n8nWebhookUrl } = usePosts();

  const [activePlatform, setActivePlatform] = useState<SocialConnector['platform'] | null>(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [handleInput, setHandleInput] = useState('');

  const handleOpenConnect = (platform: SocialConnector['platform']) => {
    setActivePlatform(platform);
    if (platform === 'instagram') {
      setAccountNameInput('Instagram Store');
      setHandleInput('@digilocal.store');
    } else if (platform === 'facebook') {
      setAccountNameInput('Facebook Storefront Page');
      setHandleInput('DigiLocal Super Store');
    } else {
      setAccountNameInput('LinkedIn Company');
      setHandleInput('DigiLocal Retail Solutions');
    }
  };

  const handleSaveConnection = async () => {
    if (!activePlatform || !handleInput.trim()) return;
    await connectAccount(activePlatform, accountNameInput.trim(), handleInput.trim());
    setActivePlatform(null);
    Alert.alert('Connected', `${activePlatform.toUpperCase()} linked successfully.`);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Overview Banner */}
      <Card className="bg-white border-blue-100 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Share2 size={20} color="#2563eb" className="mr-2" />
            <Text className="text-base font-extrabold text-slate-900">Social Connectors</Text>
          </View>
          <Badge label={`${connectedCount} of 3 Connected`} variant="success" size="sm" />
        </View>
        <Text className="text-xs text-slate-600 leading-relaxed mb-3">
          Cross-publish your Google Business updates, offers, and store announcements to Instagram, Facebook, and LinkedIn automatically via n8n backend workflows.
        </Text>

        <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Radio size={14} color="#10b981" className="mr-1.5" />
            <Text className="text-[11px] font-semibold text-slate-700" numberOfLines={1}>
              Backend: {n8nWebhookUrl.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <Badge label="Active" variant="success" size="sm" />
        </View>
      </Card>

      {/* Connectors List */}
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
        Connected Platforms
      </Text>

      {connectors.map((c) => (
        <Card key={c.id} className="mb-3.5 bg-white border-slate-200/80 shadow-xs">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <Text className="text-sm font-extrabold text-slate-900 mr-2">{c.name}</Text>
                {c.connected ? (
                  <Badge label="Connected" variant="success" size="sm" />
                ) : (
                  <Badge label="Disconnected" variant="neutral" size="sm" />
                )}
              </View>
              <Text className="text-xs text-blue-600 font-semibold">{c.handle}</Text>
            </View>

            {c.connected ? (
              <Pressable
                onPress={() => disconnectAccount(c.id)}
                className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
              >
                <Text className="text-[11px] font-bold text-slate-600">Disconnect</Text>
              </Pressable>
            ) : (
              <Button
                title="Connect"
                onPress={() => handleOpenConnect(c.platform)}
                size="sm"
                variant="primary"
              />
            )}
          </View>

          {/* Followers and Sync stats */}
          <View className="flex-row items-center justify-between bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-100">
            <View>
              <Text className="text-[10px] text-slate-500 uppercase font-bold">Audience</Text>
              <Text className="text-xs font-bold text-slate-800">
                {c.followersCount ? `${c.followersCount.toLocaleString()} Followers` : 'Ready to sync'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] text-slate-500 uppercase font-bold">Last Cross-Post</Text>
              <Text className="text-xs font-bold text-slate-800">
                {c.lastSyncAt
                  ? new Date(c.lastSyncAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </Text>
            </View>
          </View>

          {/* Auto Cross Post Switch */}
          <View className="flex-row items-center justify-between border-t border-slate-100 pt-2.5">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-slate-800">Auto Cross-Publish</Text>
              <Text className="text-[11px] text-slate-500">
                Automatically mirror GMB updates to this channel via n8n.
              </Text>
            </View>
            <Switch
              value={c.autoCrossPost}
              onValueChange={() => toggleAutoCrossPost(c.id)}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={c.autoCrossPost ? '#2563eb' : '#f1f5f9'}
            />
          </View>
        </Card>
      ))}

      {/* Connect Account Modal */}
      <Modal visible={activePlatform !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center p-4">
          <Card className="bg-white rounded-2xl p-5">
            <Text className="text-base font-bold text-slate-900 mb-1">
              Link {activePlatform?.toUpperCase()} Channel
            </Text>
            <Text className="text-xs text-slate-600 mb-4 leading-normal">
              Authorize cross-posting to your business profile. n8n will handle publishing and token refresh.
            </Text>

            <Text className="text-xs font-bold text-slate-700 mb-1">Account Display Name</Text>
            <TextInput
              value={accountNameInput}
              onChangeText={setAccountNameInput}
              placeholder="e.g. My Store Page"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 mb-3"
              placeholderTextColor="#94a3b8"
            />

            <Text className="text-xs font-bold text-slate-700 mb-1">Profile Handle / Page ID</Text>
            <TextInput
              value={handleInput}
              onChangeText={setHandleInput}
              placeholder="@handle or Page ID"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 mb-4"
              placeholderTextColor="#94a3b8"
            />

            <View className="flex-row space-x-2">
              <Button
                title="Cancel"
                onPress={() => setActivePlatform(null)}
                size="md"
                variant="outline"
                className="flex-1 border-slate-300"
              />
              <Button
                title="Connect Account"
                onPress={handleSaveConnection}
                size="md"
                variant="primary"
                className="flex-1"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
};
