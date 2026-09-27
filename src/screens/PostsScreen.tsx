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
  Trash2,
  Settings,
  Radio,
  Image as ImageIcon,
  Gift,
  Flame,
} from 'lucide-react-native';
import { usePosts } from '../context/PostsContext';
import { useGoogle } from '../context/GoogleContext';
import { useSocial } from '../context/SocialContext';
import { AIService } from '../services/ai/gemini';
import { Button, Card, Badge } from '../components';
import { GMBPostType, PostChannel, PostCallToAction } from '../types';

interface FestivalEvent {
  id: string;
  name: string;
  dateLabel: string;
  emoji: string;
  category: string;
  aiIdea: string;
  defaultCoupon: string;
  bannerUrl: string;
}

const UPCOMING_FESTIVALS: FestivalEvent[] = [
  {
    id: 'fest-diwali',
    name: 'Diwali & Dhanteras',
    dateLabel: 'Oct 29 - Nov 1',
    emoji: '🪔',
    category: 'Mega Festival',
    aiIdea: 'Launch a "Festival of Lights" Flat 25% OFF storewide offer + free festive gift on orders above ₹999.',
    defaultCoupon: 'DIWALI25',
    bannerUrl: 'https://images.unsplash.com/photo-1514195037031-83d60ed3b448?w=800',
  },
  {
    id: 'fest-bhaidooj',
    name: 'Bhai Dooj & Chhath Puja',
    dateLabel: 'Nov 3 - Nov 7',
    emoji: '🙏',
    category: 'Cultural',
    aiIdea: 'Share warm festive greetings & promote family combo hampers to attract local shoppers.',
    defaultCoupon: 'FESTIVE20',
    bannerUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=800',
  },
  {
    id: 'fest-christmas',
    name: 'Christmas & Winter Carnival',
    dateLabel: 'Dec 24 - Dec 25',
    emoji: '🎄',
    category: 'Holiday Season',
    aiIdea: 'Run a Year-End Secret Santa & Holiday Special discount to boost December store visits.',
    defaultCoupon: 'XMAS25',
    bannerUrl: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800',
  },
  {
    id: 'fest-newyear',
    name: 'New Year Grand Welcome',
    dateLabel: 'Dec 31 - Jan 2',
    emoji: '🎆',
    category: 'Celebration',
    aiIdea: 'Announce New Year fresh arrivals and an exclusive 3-day Welcome 2027 Early Bird deal.',
    defaultCoupon: 'NEWYEAR27',
    bannerUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800',
  },
  {
    id: 'fest-republic',
    name: 'Republic Day Sale',
    dateLabel: 'Jan 26',
    emoji: '🇮🇳',
    category: 'National Event',
    aiIdea: 'Celebrate 26th January with a special 26% Freedom Savings offer on top-rated items.',
    defaultCoupon: 'INDIA26',
    bannerUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800',
  },
  {
    id: 'fest-holi',
    name: 'Holi Festival of Colors',
    dateLabel: 'Mar 14',
    emoji: '🎨',
    category: 'Spring Festival',
    aiIdea: 'Vibrant "Splash of Colors" campaign featuring festive combos and colorful store visuals.',
    defaultCoupon: 'HOLI30',
    bannerUrl: 'https://images.unsplash.com/photo-1616091216791-a5360b5fc78a?w=800',
  },
  {
    id: 'fest-eid',
    name: 'Eid ul-Fitr Celebration',
    dateLabel: 'Mar 31',
    emoji: '🌙',
    category: 'Festival',
    aiIdea: 'Share heartfelt Eid Mubarak wishes and showcase festive family specials & gift boxes.',
    defaultCoupon: 'EIDSPECIAL',
    bannerUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
  },
  {
    id: 'fest-weekend',
    name: 'Super Weekend Flash Rush',
    dateLabel: 'Every Sat - Sun',
    emoji: '⚡',
    category: 'Weekly Booster',
    aiIdea: 'Drive instant weekend footfall on Google Maps with a 48-hour VIP walk-in discount.',
    defaultCoupon: 'WEEKEND15',
    bannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
  },
];

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

  const [selectedFestival, setSelectedFestival] = useState<FestivalEvent>(UPCOMING_FESTIVALS[0]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [postType, setPostType] = useState<GMBPostType>('OFFER');
  const [gmbSummary, setGmbSummary] = useState('');
  const [socialCaption, setSocialCaption] = useState('');
  const [activeCaptionTab, setActiveCaptionTab] = useState<'gmb' | 'social'>('gmb');
  const [mediaUrl, setMediaUrl] = useState(UPCOMING_FESTIVALS[0].bannerUrl);
  const [selectedChannels, setSelectedChannels] = useState<PostChannel[]>([
    'gmb',
    'instagram',
    'facebook',
    'linkedin',
  ]);
  const [ctaType, setCtaType] = useState<PostCallToAction['actionType']>('SHOP');
  const [ctaUrl, setCtaUrl] = useState('https://digilocal.ai');
  const [couponCode, setCouponCode] = useState(UPCOMING_FESTIVALS[0].defaultCoupon);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // n8n Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(n8nWebhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSelectFestival = (fest: FestivalEvent) => {
    setSelectedFestival(fest);
    setMediaUrl(fest.bannerUrl);
    setCouponCode(fest.defaultCoupon);
  };

  const handleGenerateFestivalPost = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await AIService.generateFestivalPostCampaign({
        festivalName: selectedFestival.name,
        festivalDate: selectedFestival.dateLabel,
        businessName: selectedLocation?.title || 'Our Store',
        businessCategory:
          selectedLocation?.categories?.primaryCategory?.displayName || 'Local Retail & Services',
      });

      setGmbSummary(generated.gmbCaption);
      setSocialCaption(generated.socialCaption);
      setPostType(generated.postType);
      if (generated.couponCode) setCouponCode(generated.couponCode);
      setCtaType(generated.ctaType);
      setMediaUrl(generated.suggestedImageUrl || selectedFestival.bannerUrl);
    } catch (e: any) {
      Alert.alert('AI Post Generator', e.message || 'Could not generate post');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const toggleChannel = (channel: PostChannel) => {
    if (channel === 'gmb') return; // GMB is always primary
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleCreatePost = async (publishImmediately: boolean) => {
    const finalSummary = gmbSummary.trim() || socialCaption.trim();
    if (!finalSummary) {
      Alert.alert(
        'Post Content Required',
        'Click "Generate Complete Post with AI" above or write your caption first.'
      );
      return;
    }

    setIsSubmitting(true);
    const scheduledTime = publishImmediately ? Date.now() : Date.now() + 1000 * 60 * 60 * 24;

    const combinedSummary =
      socialCaption.trim() && gmbSummary.trim()
        ? `${gmbSummary.trim()}\n\n[Social Copy]: ${socialCaption.trim()}`
        : finalSummary;

    const result = await schedulePost({
      postType,
      summary: combinedSummary,
      mediaUrl: mediaUrl.trim() || undefined,
      callToAction: {
        actionType: ctaType,
        url: ctaUrl.trim() || undefined,
      },
      offerDetails: postType === 'OFFER' ? { couponCode: couponCode || 'FESTIVE20' } : undefined,
      channels: selectedChannels,
      scheduledTime,
    });

    setIsSubmitting(false);
    if (result.success) {
      setGmbSummary('');
      setSocialCaption('');
      Alert.alert('Post Scheduled & Dispatched', result.message);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  const handleSaveWebhook = async () => {
    await updateWebhookUrl(tempWebhookUrl);
    setShowConfigModal(false);
    Alert.alert('n8n Configured', 'Webhook endpoint updated for automated multi-channel publishing.');
  };

  const handleTestWebhook = async () => {
    await updateWebhookUrl(tempWebhookUrl);
    setIsTestingWebhook(true);
    setTestResult(null);
    const res = await testWebhook();
    setIsTestingWebhook(false);
    setTestResult(res.message);
  };

  const ctaOptions: Array<PostCallToAction['actionType']> = [
    'SHOP',
    'LEARN_MORE',
    'BOOK',
    'ORDER',
    'CALL',
  ];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 44 }}>
      {/* Top Location & n8n Status Banner */}
      <View className="flex-row items-center justify-between bg-slate-900 p-3.5 rounded-2xl mb-4">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
            <Radio size={18} color="#60a5fa" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-white mr-2">AI Festival Scheduler & n8n</Text>
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
            </View>
            <Text className="text-[11px] text-slate-400" numberOfLines={1}>
              Listing: {selectedLocation?.title || 'Connected GMB Listing'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            setTempWebhookUrl(n8nWebhookUrl);
            setTestResult(null);
            setShowConfigModal(true);
          }}
          className="bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 flex-row items-center"
        >
          <Settings size={14} color="#94a3b8" />
          <Text className="text-xs font-semibold text-slate-200 ml-1.5">n8n URL</Text>
        </Pressable>
      </View>

      {/* SECTION 1: Interactive Festival & Event Calendar */}
      <Card className="mb-4 border-indigo-100 bg-white">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center">
            <Calendar size={18} color="#4f46e5" className="mr-2" />
            <Text className="text-sm font-bold text-slate-900">
              Festival & Marketing Calendar
            </Text>
          </View>
          <Badge label="AI Suggestions" variant="primary" size="sm" />
        </View>
        <Text className="text-xs text-slate-500 mb-3">
          Select an upcoming festival below to see AI post ideas and generate ready-to-publish GMB & social media posts with images.
        </Text>

        {/* Horizontal Festival Date Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
          {UPCOMING_FESTIVALS.map((fest) => {
            const isSelected = selectedFestival.id === fest.id;
            return (
              <Pressable
                key={fest.id}
                onPress={() => handleSelectFestival(fest)}
                className={`mr-2.5 p-3 rounded-2xl border w-40 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-slate-50 border-slate-200 active:bg-slate-100'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xl">{fest.emoji}</Text>
                  <View
                    className={`px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-500' : 'bg-slate-200/80'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {fest.dateLabel}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-xs font-extrabold mb-0.5 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                  numberOfLines={1}
                >
                  {fest.name}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                >
                  {fest.category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* AI Idea Spotlight Box for Selected Festival */}
        <View className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center">
              <Sparkles size={15} color="#4f46e5" />
              <Text className="text-xs font-extrabold text-indigo-950 ml-1.5">
                AI Post Idea for {selectedFestival.name} ({selectedFestival.dateLabel})
              </Text>
            </View>
          </View>
          <Text className="text-xs text-slate-700 leading-relaxed mb-3">
            💡 {selectedFestival.aiIdea}
          </Text>

          <Button
            title={
              isGeneratingAI
                ? 'Gemini AI is Generating Captions & Poster...'
                : `Generate ${selectedFestival.name} Post with AI`
            }
            onPress={handleGenerateFestivalPost}
            loading={isGeneratingAI}
            variant="primary"
            size="sm"
            icon={<Sparkles size={15} color="#ffffff" />}
          />
        </View>
      </Card>

      {/* SECTION 2: Generated Post Composer (GMB + Social Media + Visual Banner) */}
      <Card className="mb-5 border-blue-100 bg-white">
        <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center">
            <Share2 size={18} color="#2563eb" className="mr-2" />
            <Text className="text-base font-bold text-slate-900">Post Composer & Preview</Text>
          </View>
          <Badge label="GMB + Social" variant="primary" size="sm" />
        </View>

        {/* Visual Poster / Image Preview */}
        {mediaUrl ? (
          <View className="mb-3 rounded-2xl overflow-hidden h-44 bg-slate-900 relative border border-slate-200">
            <Image source={{ uri: mediaUrl }} className="w-full h-full opacity-85" resizeMode="cover" />
            <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-extrabold text-white" numberOfLines={1}>
                  {selectedFestival.emoji} {selectedFestival.name} Special
                </Text>
                {postType === 'OFFER' && couponCode ? (
                  <View className="bg-amber-400 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-black text-slate-950">CODE: {couponCode}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-[11px] text-slate-200 mt-0.5" numberOfLines={1}>
                {selectedLocation?.title || 'Verified GMB Store'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Post Type Selector */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Post Format</Text>
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
                  postType === type ? 'text-white' : 'text-slate-600'
                }`}
              >
                {type === 'STANDARD' ? "What's New" : type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Dual Caption Switcher: GMB vs Social Media */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl mb-2">
          <Pressable
            onPress={() => setActiveCaptionTab('gmb')}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              activeCaptionTab === 'gmb' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeCaptionTab === 'gmb' ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              📍 GMB Listing Caption
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveCaptionTab('social')}
            className={`flex-1 py-1.5 rounded-lg items-center ${
              activeCaptionTab === 'social' ? 'bg-white shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeCaptionTab === 'social' ? 'text-indigo-600' : 'text-slate-600'
              }`}
            >
              📸 Insta / FB / LinkedIn Caption
            </Text>
          </Pressable>
        </View>

        {activeCaptionTab === 'gmb' ? (
          <TextInput
            multiline
            numberOfLines={4}
            value={gmbSummary}
            onChangeText={setGmbSummary}
            placeholder="Click 'Generate Post with AI' above or write your Google Business update..."
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3 min-h-[95px]"
            textAlignVertical="top"
          />
        ) : (
          <TextInput
            multiline
            numberOfLines={4}
            value={socialCaption}
            onChangeText={setSocialCaption}
            placeholder="AI-generated social media caption with emojis & hashtags will appear here..."
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3 min-h-[95px]"
            textAlignVertical="top"
          />
        )}

        {/* Offer Coupon Code if OFFER */}
        {postType === 'OFFER' && (
          <View className="mb-3">
            <Text className="text-xs font-bold text-slate-700 mb-1">Festival Promo / Coupon Code</Text>
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="e.g. DIWALI25"
              placeholderTextColor="#94a3b8"
              className="bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-amber-900"
            />
          </View>
        )}

        {/* Creative Banner URL */}
        <Text className="text-xs font-bold text-slate-700 mb-1">Creative Banner Image URL</Text>
        <TextInput
          value={mediaUrl}
          onChangeText={setMediaUrl}
          placeholder="https://..."
          placeholderTextColor="#94a3b8"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-3"
        />

        {/* Call To Action */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">Action Button (CTA)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
          {ctaOptions.map((act) => (
            <Pressable
              key={act}
              onPress={() => setCtaType(act)}
              className={`mr-2 px-3 py-1.5 rounded-lg border ${
                ctaType === act
                  ? 'bg-slate-800 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  ctaType === act ? 'text-white' : 'text-slate-600'
                }`}
              >
                {act.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Cross-Post Channels */}
        <Text className="text-xs font-bold text-slate-700 mb-1.5">
          Target Channels (via n8n & GMB API)
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(['gmb', 'instagram', 'facebook', 'linkedin'] as PostChannel[]).map((ch) => {
            const active = selectedChannels.includes(ch);
            const socialConn = connectors.find((c) => c.platform === ch);
            const isConnected = ch === 'gmb' ? true : socialConn?.connected;

            return (
              <Pressable
                key={ch}
                onPress={() => toggleChannel(ch)}
                className={`px-3 py-2 rounded-xl border flex-row items-center ${
                  active
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <CheckCircle size={14} color={active ? '#2563eb' : '#94a3b8'} />
                <Text
                  className={`text-xs font-bold ml-1.5 capitalize ${
                    active ? 'text-blue-900' : 'text-slate-500'
                  }`}
                >
                  {ch === 'gmb' ? 'Google Business' : ch}
                </Text>
                {!isConnected && ch !== 'gmb' && (
                  <Text className="text-[9px] text-amber-600 ml-1 font-semibold">(Connect)</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <View className="flex-1">
            <Button
              title="Schedule Post"
              onPress={() => handleCreatePost(false)}
              loading={isSubmitting}
              variant="secondary"
              icon={<Clock size={16} color="#1e293b" />}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Publish Now"
              onPress={() => handleCreatePost(true)}
              loading={isSubmitting}
              variant="primary"
              icon={<Send size={16} color="#ffffff" />}
            />
          </View>
        </View>
      </Card>

      {/* SECTION 3: Scheduled & Published Queue */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-bold text-slate-900">Post Queue ({filteredPosts.length})</Text>
        <View className="flex-row space-x-1">
          {(['all', 'scheduled', 'published'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg ${
                filter === f ? 'bg-blue-600' : 'bg-slate-200/70'
              }`}
            >
              <Text
                className={`text-[11px] font-bold capitalize ${
                  filter === f ? 'text-white' : 'text-slate-600'
                }`}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filteredPosts.length === 0 ? (
        <Card className="items-center py-8 bg-white">
          <Calendar size={32} color="#94a3b8" className="mb-2" />
          <Text className="text-sm font-bold text-slate-700">No Posts in Queue</Text>
          <Text className="text-xs text-slate-400 text-center mt-1">
            Pick a festival from the calendar above and click Generate with AI!
          </Text>
        </Card>
      ) : (
        filteredPosts.map((post) => (
          <Card key={post.id} className="mb-3 bg-white border-slate-200/80">
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

      {/* n8n Webhook Configuration Modal */}
      <Modal visible={showConfigModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-slate-900">
                n8n Backend Webhook Configuration
              </Text>
              <Pressable onPress={() => setShowConfigModal(false)}>
                <Text className="text-xs font-bold text-slate-500">Close</Text>
              </Pressable>
            </View>

            <Text className="text-xs text-slate-500 mb-3 leading-relaxed">
              Every scheduled or immediate post dispatches a structured JSON payload (location, GMB caption, social caption, banner URL, CTA, and target platforms) to your n8n workflow.
            </Text>

            <Text className="text-xs font-bold text-slate-700 mb-1">n8n Webhook Endpoint (POST)</Text>
            <TextInput
              value={tempWebhookUrl}
              onChangeText={setTempWebhookUrl}
              placeholder="https://your-n8n.app.n8n.cloud/webhook/gmb-post"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 mb-3"
            />

            {testResult && (
              <View className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-3">
                <Text className="text-xs text-blue-900 font-medium">{testResult}</Text>
              </View>
            )}

            <View className="flex-row space-x-2">
              <View className="flex-1">
                <Button
                  title={isTestingWebhook ? 'Pinging...' : 'Test Connection'}
                  onPress={handleTestWebhook}
                  variant="secondary"
                  loading={isTestingWebhook}
                />
              </View>
              <View className="flex-1">
                <Button title="Save Endpoint" onPress={handleSaveWebhook} variant="primary" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
