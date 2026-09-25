import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import {
  Calendar,
  Clock,
  Send,
  Sparkles,
  Share2,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  ExternalLink,
  Tag,
  Radio,
} from 'lucide-react-native';
import { usePosts } from '../context/PostsContext';
import { useGoogle } from '../context/GoogleContext';
import { useSocial } from '../context/SocialContext';
import { Button, Card, Badge, LoadingState } from '../components';
import { GMBPostType, PostChannel, PostCallToAction } from '../types';

export const PostsScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const {
    posts,
    schedulePost,
    publishNow,
    deletePost,
    filter,
    setFilter,
    filteredPosts,
    n8nWebhookUrl,
    updateWebhookUrl,
    testWebhook,
  } = usePosts();
  const { connectors } = useSocial();

  const [postType, setPostType] = useState<GMBPostType>('STANDARD');
  const [summary, setSummary] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<PostChannel[]>(['gmb', 'instagram', 'facebook']);
  const [ctaType, setCtaType] = useState<PostCallToAction['actionType']>('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState('https://digilocal.ai');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(n8nWebhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const toggleChannel = (channel: PostChannel) => {
    if (channel === 'gmb') return; // GMB is always primary
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleCreatePost = async (publishImmediately: boolean) => {
    if (!summary.trim()) {
      Alert.alert('Post content required', 'Please write your post summary or update message.');
      return;
    }

    setIsSubmitting(true);
    const scheduledTime = publishImmediately ? Date.now() : Date.now() + 1000 * 60 * 60 * 24; // tomorrow if scheduled

    const result = await schedulePost({
      postType,
      summary: summary.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      callToAction: {
        actionType: ctaType,
        url: ctaUrl.trim() || undefined,
      },
      offerDetails: postType === 'OFFER' ? { couponCode: couponCode || 'SAVE20' } : undefined,
      channels: selectedChannels,
      scheduledTime,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSummary('');
      setMediaUrl('');
      setCouponCode('');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    const res = await testWebhook();
    setIsTestingWebhook(false);
    setTestResult(res.message);
  };

  const handleSaveWebhook = async () => {
    await updateWebhookUrl(tempWebhookUrl);
    setShowConfigModal(false);
    Alert.alert('Saved', 'n8n Webhook URL updated successfully.');
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Top Banner / Location & Backend status */}
      <View className="flex-row items-center justify-between mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <View className="flex-1 mr-3">
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Storefront
          </Text>
          <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
            {selectedLocation?.title || 'My Google Business Profile'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setTempWebhookUrl(n8nWebhookUrl);
            setShowConfigModal(true);
          }}
          className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 active:bg-blue-100"
        >
          <Radio size={14} color="#2563eb" className="mr-1.5" />
          <Text className="text-xs font-bold text-blue-700">n8n Backend</Text>
        </Pressable>
      </View>

      {/* Post Composer Card */}
      <Card className="mb-5 border-blue-100 bg-white">
        <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center">
            <Share2 size={18} color="#2563eb" className="mr-2" />
            <Text className="text-base font-bold text-slate-900">Create & Schedule Post</Text>
          </View>
          <Badge label="Cross-Posting" variant="primary" size="sm" />
        </View>

        {/* Post Type Selector */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Post Type</Text>
        <View className="flex-row space-x-2 mb-3">
          {(['STANDARD', 'OFFER', 'EVENT'] as GMBPostType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setPostType(type)}
              className={`flex-1 py-2 rounded-xl items-center border ${
                postType === type
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  postType === type ? 'text-white' : 'text-slate-700'
                }`}
              >
                {type === 'STANDARD' ? "What's New" : type === 'OFFER' ? 'Offer / Sale' : 'Event'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Post Text Input */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Post Content</Text>
        <TextInput
          multiline
          numberOfLines={4}
          value={summary}
          onChangeText={setSummary}
          placeholder="Share an update, seasonal promotion, or special discount for local customers..."
          className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 mb-3 h-24 text-align-top"
          placeholderTextColor="#94a3b8"
        />

        {/* Offer Details if OFFER */}
        {postType === 'OFFER' && (
          <View className="mb-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <Text className="text-xs font-bold text-amber-900 mb-1">Coupon / Promo Code</Text>
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="e.g. FESTIVE20 or SAVE50"
              className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}

        {/* Photo URL Input & Preview */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Photo / Media URL (Optional)</Text>
        <TextInput
          value={mediaUrl}
          onChangeText={setMediaUrl}
          placeholder="https://example.com/store-photo.jpg"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 mb-2"
          placeholderTextColor="#94a3b8"
        />
        {mediaUrl ? (
          <View className="mb-3 rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
            <Image source={{ uri: mediaUrl }} className="w-full h-full" resizeMode="cover" />
          </View>
        ) : null}

        {/* Call to Action Button Picker */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Google Maps Action Button (CTA)</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {(['CALL', 'LEARN_MORE', 'ORDER', 'BOOK', 'SIGN_UP'] as PostCallToAction['actionType'][]).map(
            (cta) => (
              <Pressable
                key={cta}
                onPress={() => setCtaType(cta)}
                className={`px-2.5 py-1.5 rounded-lg border ${
                  ctaType === cta ? 'bg-blue-50 border-blue-500' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    ctaType === cta ? 'text-blue-700' : 'text-slate-600'
                  }`}
                >
                  {cta === 'CALL'
                    ? '📞 Call Now'
                    : cta === 'LEARN_MORE'
                    ? '🌐 Learn More'
                    : cta === 'ORDER'
                    ? '🛍️ Order'
                    : cta === 'BOOK'
                    ? '📅 Book'
                    : '✍️ Sign Up'}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* Target Channels */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Publish To Channels</Text>
        <View className="flex-row space-x-2 mb-4">
          <Pressable
            className="flex-1 p-2 rounded-xl bg-blue-100 border border-blue-300 items-center opacity-90"
          >
            <Text className="text-xs font-bold text-blue-900">Google GMB ✓</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleChannel('instagram')}
            className={`flex-1 p-2 rounded-xl border items-center ${
              selectedChannels.includes('instagram')
                ? 'bg-purple-100 border-purple-300'
                : 'bg-slate-100 border-slate-200 opacity-50'
            }`}
          >
            <Text className="text-xs font-bold text-purple-900">
              Insta {selectedChannels.includes('instagram') ? '✓' : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => toggleChannel('facebook')}
            className={`flex-1 p-2 rounded-xl border items-center ${
              selectedChannels.includes('facebook')
                ? 'bg-sky-100 border-sky-300'
                : 'bg-slate-100 border-slate-200 opacity-50'
            }`}
          >
            <Text className="text-xs font-bold text-sky-900">
              Facebook {selectedChannels.includes('facebook') ? '✓' : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => toggleChannel('linkedin')}
            className={`flex-1 p-2 rounded-xl border items-center ${
              selectedChannels.includes('linkedin')
                ? 'bg-blue-100 border-blue-400'
                : 'bg-slate-100 border-slate-200 opacity-50'
            }`}
          >
            <Text className="text-xs font-bold text-blue-900">
              LinkedIn {selectedChannels.includes('linkedin') ? '✓' : ''}
            </Text>
          </Pressable>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <Button
            title="Publish Now"
            onPress={() => handleCreatePost(true)}
            size="md"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button
            title="Schedule (Tomorrow)"
            onPress={() => handleCreatePost(false)}
            size="md"
            variant="outline"
            className="flex-1 bg-white border-blue-300"
            disabled={isSubmitting}
          />
        </View>
      </Card>

      {/* Scheduled & Published Posts List */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-extrabold text-slate-900">Post Feed & Schedule</Text>
        <View className="flex-row space-x-1 bg-slate-200/80 p-0.5 rounded-lg">
          {(['all', 'scheduled', 'published'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md ${filter === f ? 'bg-white shadow-xs' : ''}`}
            >
              <Text
                className={`text-[11px] font-bold capitalize ${
                  filter === f ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filteredPosts.length === 0 ? (
        <Card className="items-center py-8 bg-white border-slate-200">
          <Calendar size={32} color="#94a3b8" className="mb-2" />
          <Text className="text-sm font-bold text-slate-800">No {filter} posts found</Text>
          <Text className="text-xs text-slate-500 text-center mt-1">
            Create an update or promotion above to schedule across Google & Socials.
          </Text>
        </Card>
      ) : (
        filteredPosts.map((post) => (
          <Card key={post.id} className="mb-3 bg-white border-slate-200/90 shadow-xs">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center flex-wrap gap-1.5 flex-1 mr-2">
                <Badge
                  label={post.postType}
                  variant={post.postType === 'OFFER' ? 'warning' : 'primary'}
                  size="sm"
                />
                <Badge
                  label={post.status.toUpperCase()}
                  variant={post.status === 'published' ? 'success' : 'neutral'}
                  size="sm"
                />
                <Text className="text-[11px] text-slate-500">
                  {new Date(post.scheduledTime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Pressable onPress={() => deletePost(post.id)} className="p-1 active:opacity-60">
                <Trash2 size={16} color="#94a3b8" />
              </Pressable>
            </View>

            <Text className="text-sm text-slate-800 leading-relaxed mb-2.5 font-medium">
              {post.summary}
            </Text>

            {post.mediaUrl ? (
              <View className="mb-2.5 rounded-xl overflow-hidden h-36 bg-slate-100 border border-slate-200">
                <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
              </View>
            ) : null}

            {/* Channels & Action footer */}
            <View className="flex-row items-center justify-between border-t border-slate-100 pt-2.5">
              <View className="flex-row items-center flex-wrap gap-1">
                {post.channels.map((ch) => (
                  <View key={ch} className="bg-slate-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-slate-600 uppercase">{ch}</Text>
                  </View>
                ))}
              </View>

              {post.status === 'scheduled' && (
                <Button
                  title="Dispatch Now"
                  onPress={() => publishNow(post.id)}
                  size="sm"
                  variant="primary"
                />
              )}
            </View>

            {post.n8nWebhookResponse && (
              <View className="mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <Text className="text-[11px] text-emerald-800 font-semibold" numberOfLines={1}>
                  n8n: {post.n8nWebhookResponse}
                </Text>
              </View>
            )}
          </Card>
        ))
      )}

      {/* n8n Backend Configuration Modal */}
      <Modal visible={showConfigModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center p-4">
          <Card className="bg-white rounded-2xl p-5">
            <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <Text className="text-base font-bold text-slate-900">n8n Automation Backend</Text>
              <Pressable onPress={() => setShowConfigModal(false)}>
                <Text className="text-xs font-bold text-slate-500">Close</Text>
              </Pressable>
            </View>

            <Text className="text-xs text-slate-600 leading-normal mb-3">
              DigiLocal.ai dispatches scheduled posts and social media triggers to your self-hosted or cloud n8n webhook workflow.
            </Text>

            <Text className="text-xs font-bold text-slate-800 mb-1">Webhook URL</Text>
            <TextInput
              value={tempWebhookUrl}
              onChangeText={setTempWebhookUrl}
              placeholder="https://n8n.yourdomain.com/webhook/gmb-scheduler"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 mb-3"
              placeholderTextColor="#94a3b8"
            />

            <Button
              title={isTestingWebhook ? 'Testing Connection...' : '⚡ Test Connection Ping'}
              onPress={handleTestWebhook}
              size="sm"
              variant="outline"
              className="mb-3 border-blue-300 bg-blue-50"
              disabled={isTestingWebhook}
            />

            {testResult && (
              <View className="p-2.5 rounded-xl bg-slate-100 mb-3 border border-slate-200">
                <Text className="text-xs text-slate-700 font-medium">{testResult}</Text>
              </View>
            )}

            <Button
              title="Save & Apply Webhook"
              onPress={handleSaveWebhook}
              size="md"
              variant="primary"
            />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
};
