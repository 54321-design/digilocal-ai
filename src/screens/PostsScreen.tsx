import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
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
  RefreshCw,
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
}

const UPCOMING_FESTIVALS: FestivalEvent[] = [
  {
    id: 'fest-navratri',
    name: 'Navratri & Dussehra',
    dateLabel: 'Oct 3 - Oct 12',
    emoji: '🔱',
    category: 'Auspicious Fest',
    aiIdea: 'Highlight auspicious festive beginnings, special Navratri offers, and Dussehra victory deals tailored to your business.',
    defaultCoupon: 'NAVRATRI20',
  },
  {
    id: 'fest-karwachauth',
    name: 'Karwa Chauth Special',
    dateLabel: 'Oct 20',
    emoji: '🌙',
    category: 'Special Occasion',
    aiIdea: 'Promote special gifting, pampering packages, or festive celebration offers for couples and families.',
    defaultCoupon: 'FESTIVE15',
  },
  {
    id: 'fest-dhanteras',
    name: 'Dhanteras Prosperity',
    dateLabel: 'Oct 29',
    emoji: '🪙',
    category: 'Muhurat & Auspicious',
    aiIdea: 'Invite customers for auspicious Dhanteras bookings, consultations, or purchases with assured festive rewards.',
    defaultCoupon: 'DHANTERAS',
  },
  {
    id: 'fest-diwali',
    name: 'Diwali Festival of Lights',
    dateLabel: 'Oct 31 - Nov 1',
    emoji: '🪔',
    category: 'Mega Festival',
    aiIdea: 'Launch your biggest Diwali campaign with festive lights, warm greetings, and exclusive limited-period discounts.',
    defaultCoupon: 'DIWALI25',
  },
  {
    id: 'fest-bhaidooj',
    name: 'Bhai Dooj Celebration',
    dateLabel: 'Nov 3',
    emoji: '🎁',
    category: 'Brother-Sister Bond',
    aiIdea: 'Celebrate the bond of brother and sister with thoughtful gift vouchers, family packages, and Bhai Dooj greetings.',
    defaultCoupon: 'BHAIDOOJ20',
  },
  {
    id: 'fest-chhath',
    name: 'Chhath Puja Greetings',
    dateLabel: 'Nov 5 - Nov 8',
    emoji: '☀️',
    category: 'Cultural & Devotional',
    aiIdea: 'Share warm Chhath Puja wishes and special community offers to build strong local trust and engagement.',
    defaultCoupon: 'CHHATH15',
  },
  {
    id: 'fest-christmas',
    name: 'Christmas & Year-End',
    dateLabel: 'Dec 25',
    emoji: '🎄',
    category: 'Holiday Season',
    aiIdea: 'Run a Year-End Holiday Special to attract December shoppers and close the year with strong local footfall.',
    defaultCoupon: 'XMAS25',
  },
  {
    id: 'fest-newyear',
    name: 'New Year Grand Welcome',
    dateLabel: 'Jan 1',
    emoji: '🎆',
    category: 'Celebration',
    aiIdea: 'Welcome the New Year with fresh services, new launches, and an Early Bird resolution offer for your clients.',
    defaultCoupon: 'NEWYEAR',
  },
  {
    id: 'fest-makarsankranti',
    name: 'Makar Sankranti & Lohri',
    dateLabel: 'Jan 13 - Jan 14',
    emoji: '🪁',
    category: 'Harvest Festival',
    aiIdea: 'Celebrate Lohri and Makar Sankranti with vibrant festive greetings and auspicious season deals.',
    defaultCoupon: 'SANKRANTI',
  },
  {
    id: 'fest-republic',
    name: 'Republic Day Pride',
    dateLabel: 'Jan 26',
    emoji: '🇮🇳',
    category: 'National Event',
    aiIdea: 'Celebrate 26th January with a special Freedom Savings offer on your top services and products.',
    defaultCoupon: 'INDIA26',
  },
  {
    id: 'fest-holi',
    name: 'Holi Festival of Colors',
    dateLabel: 'Mar 14',
    emoji: '🎨',
    category: 'Spring Festival',
    aiIdea: 'Vibrant Splash of Colors campaign featuring festive combos and colorful brand visuals.',
    defaultCoupon: 'HOLI25',
  },
  {
    id: 'fest-eid',
    name: 'Eid ul-Fitr Celebration',
    dateLabel: 'Mar 31',
    emoji: '🌙',
    category: 'Festival',
    aiIdea: 'Share heartfelt Eid Mubarak wishes and showcase festive specials for families and clients.',
    defaultCoupon: 'EIDSPECIAL',
  },
];

export const PostsScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const {
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

  const [selectedFestival, setSelectedFestival] = useState<FestivalEvent>(UPCOMING_FESTIVALS[4]); // Bhai Dooj / Diwali ready
  const [businessCategoryInput, setBusinessCategoryInput] = useState<string>(
    selectedLocation?.categories?.primaryCategory?.displayName || ''
  );
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [postType, setPostType] = useState<GMBPostType>('OFFER');
  const [gmbSummary, setGmbSummary] = useState('');
  const [socialCaption, setSocialCaption] = useState('');
  const [activeCaptionTab, setActiveCaptionTab] = useState<'gmb' | 'social'>('gmb');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<PostChannel[]>([
    'gmb',
    'instagram',
    'facebook',
    'linkedin',
  ]);
  const [ctaType, setCtaType] = useState<PostCallToAction['actionType']>('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState(selectedLocation?.websiteUri || 'https://digilocal.ai');
  const [couponCode, setCouponCode] = useState(UPCOMING_FESTIVALS[4].defaultCoupon);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // n8n Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(n8nWebhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation?.categories?.primaryCategory?.displayName) {
      setBusinessCategoryInput(selectedLocation.categories.primaryCategory.displayName);
    }
    if (selectedLocation?.websiteUri) {
      setCtaUrl(selectedLocation.websiteUri);
    }
  }, [selectedLocation?.id]);

  const handleSelectFestival = (fest: FestivalEvent) => {
    setSelectedFestival(fest);
    setCouponCode(fest.defaultCoupon);
  };

  const handleGenerateFestivalPost = async () => {
    setIsGeneratingAI(true);
    setIsImageLoading(true);
    try {
      const bName = selectedLocation?.title || 'Our Business';
      const bCategory =
        businessCategoryInput.trim() ||
        selectedLocation?.categories?.primaryCategory?.displayName ||
        'Local Business & Services';

      const generated = await AIService.generateFestivalPostCampaign({
        festivalName: selectedFestival.name,
        festivalDate: selectedFestival.dateLabel,
        businessName: bName,
        businessCategory: bCategory,
        customTopic: customTopicInput.trim() || undefined,
      });

      setGmbSummary(generated.gmbCaption);
      setSocialCaption(generated.socialCaption);
      setPostType(generated.postType);
      if (generated.couponCode) setCouponCode(generated.couponCode);
      setCtaType(generated.ctaType);
      setAiImagePrompt(generated.imagePrompt);
      setMediaUrl(generated.suggestedImageUrl);
    } catch (e: any) {
      Alert.alert('AI Post Generator', e.message || 'Could not generate post');
      setIsImageLoading(false);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRegenerateImageFromPrompt = () => {
    const promptToUse =
      aiImagePrompt.trim() ||
      `Professional Indian festival ${selectedFestival.name} promotional banner for ${
        businessCategoryInput.trim() || selectedLocation?.title || 'Business'
      }, festive traditional lighting, marigold flowers, high quality commercial graphic`;
    const newSeed = Math.floor(10000 + Math.random() * 90000);
    setIsImageLoading(true);
    setMediaUrl(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        promptToUse
      )}?width=1024&height=576&nologo=true&model=flux&seed=${newSeed}`
    );
  };

  const toggleChannel = (channel: PostChannel) => {
    if (channel === 'gmb') return;
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
    'LEARN_MORE',
    'SHOP',
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
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Calendar size={18} color="#4f46e5" className="mr-2" />
            <Text className="text-sm font-bold text-slate-900">
              Festival & Marketing Calendar
            </Text>
          </View>
          <Badge label="Custom AI Visuals" variant="primary" size="sm" />
        </View>
        <Text className="text-xs text-slate-500 mb-3">
          1. Pick a festival below • 2. Enter your business category/offer • 3. AI generates a custom festival image + GMB & social captions tailored to your business!
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

        {/* Business Category & Custom Angle Inputs for 100% Relevance */}
        <View className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
          <View className="flex-row items-center mb-1.5">
            <Sparkles size={15} color="#4f46e5" />
            <Text className="text-xs font-extrabold text-indigo-950 ml-1.5">
              {selectedFestival.emoji} {selectedFestival.name} ({selectedFestival.dateLabel})
            </Text>
          </View>
          <Text className="text-xs text-slate-600 leading-relaxed mb-3">
            💡 {selectedFestival.aiIdea}
          </Text>

          <Text className="text-[11px] font-bold text-slate-700 mb-1">
            Your Business Category / Niche (for relevant AI Image & Copy) *
          </Text>
          <TextInput
            value={businessCategoryInput}
            onChangeText={setBusinessCategoryInput}
            placeholder="e.g. Digital Marketing Agency / Jewellery Store / Salon / Clinic"
            placeholderTextColor="#94a3b8"
            className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-2.5"
          />

          <Text className="text-[11px] font-bold text-slate-700 mb-1">
            Specific Offer or Topic (Optional)
          </Text>
          <TextInput
            value={customTopicInput}
            onChangeText={setCustomTopicInput}
            placeholder={`e.g. Flat 20% off on ${selectedFestival.name}, Free consultation...`}
            placeholderTextColor="#94a3b8"
            className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs text-slate-800 mb-3"
          />

          <Button
            title={
              isGeneratingAI
                ? 'Generating Custom AI Image & Captions...'
                : `Generate ${selectedFestival.name} Post & AI Image`
            }
            onPress={handleGenerateFestivalPost}
            loading={isGeneratingAI}
            variant="primary"
            size="sm"
            icon={<Sparkles size={15} color="#ffffff" />}
          />
        </View>
      </Card>

      {/* SECTION 2: Generated Post Composer (GMB + Social Media + Custom AI Visual Banner) */}
      <Card className="mb-5 border-blue-100 bg-white">
        <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center">
            <Share2 size={18} color="#2563eb" className="mr-2" />
            <Text className="text-base font-bold text-slate-900">Post Composer & AI Visual</Text>
          </View>
          <Badge label="GMB + Social" variant="primary" size="sm" />
        </View>

        {/* Dynamic AI Generated Visual Poster Preview */}
        {mediaUrl ? (
          <View className="mb-3">
            <View className="rounded-2xl overflow-hidden h-48 bg-slate-900 relative border border-slate-200">
              <Image
                source={{ uri: mediaUrl }}
                className="w-full h-full"
                resizeMode="cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
              />
              {isImageLoading && (
                <View className="absolute inset-0 bg-slate-900/70 items-center justify-center">
                  <ActivityIndicator size="small" color="#60a5fa" />
                  <Text className="text-xs font-bold text-white mt-2">
                    Rendering Custom AI Festival Graphic...
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 left-0 right-0 bg-black/65 p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-extrabold text-white" numberOfLines={1}>
                    {selectedFestival.emoji} {selectedFestival.name}
                  </Text>
                  {postType === 'OFFER' && couponCode ? (
                    <View className="bg-amber-400 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-black text-slate-950">
                        CODE: {couponCode}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-[11px] text-slate-200 mt-0.5" numberOfLines={1}>
                  {selectedLocation?.title || businessCategoryInput || 'Verified GMB Business'}
                </Text>
              </View>
            </View>

            {/* AI Image Prompt Editor & Regenerate Button */}
            <View className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[11px] font-bold text-slate-700">
                  AI Visual Prompt (Customize & Regenerate Image)
                </Text>
                <Pressable
                  onPress={handleRegenerateImageFromPrompt}
                  className="flex-row items-center bg-indigo-100 px-2 py-1 rounded-md"
                >
                  <RefreshCw size={11} color="#4f46e5" />
                  <Text className="text-[10px] font-bold text-indigo-700 ml-1">
                    New AI Image
                  </Text>
                </Pressable>
              </View>
              <TextInput
                multiline
                value={aiImagePrompt}
                onChangeText={setAiImagePrompt}
                placeholder="Describe what you want in the image..."
                className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2"
              />
            </View>
          </View>
        ) : (
          <View className="mb-3 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 items-center">
            <Sparkles size={22} color="#6366f1" />
            <Text className="text-xs font-bold text-slate-700 mt-1">
              No AI Banner Generated Yet
            </Text>
            <Text className="text-[11px] text-slate-500 text-center mt-0.5">
              Select a festival above, enter your business category, and tap "Generate Post & AI Image"
            </Text>
          </View>
        )}

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
            placeholder="Click 'Generate Post & AI Image' above or write your Google Business update..."
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
              placeholder="e.g. BHAIDOOJ20"
              placeholderTextColor="#94a3b8"
              className="bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-amber-900"
            />
          </View>
        )}

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
            Pick a festival above, enter your business category, and click Generate with AI!
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
              Every scheduled or immediate post dispatches a structured JSON payload (location, GMB caption, social caption, AI banner URL, CTA, and target platforms) to your n8n workflow.
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
