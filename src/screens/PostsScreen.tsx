import React, { useState, useEffect, useMemo } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  CheckCircle,
  Trash2,
  Settings,
  RefreshCw,
  ExternalLink,
  Camera,
  MapPin,
} from 'lucide-react-native';
import { usePosts } from '../context/PostsContext';
import { useGoogle } from '../context/GoogleContext';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/ai/gemini';
import { GMBPostType, PostChannel, PostCallToAction } from '../types';

interface FestivalEvent {
  id: string;
  name: string;
  monthIndex: number; // 0-based (8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec)
  day: number;
  dateLabel: string;
  category: string;
  aiIdea: string;
  defaultCoupon: string;
}

const UPCOMING_FESTIVALS: FestivalEvent[] = [
  {
    id: 'fest-navratri',
    name: 'Navratri & Dussehra',
    monthIndex: 9,
    day: 3,
    dateLabel: '3 Oct',
    category: 'Auspicious Festival',
    aiIdea: 'Highlight auspicious festive beginnings and special Navratri offers tailored to your business.',
    defaultCoupon: 'NAVRATRI20',
  },
  {
    id: 'fest-karwachauth',
    name: 'Karwa Chauth Special',
    monthIndex: 9,
    day: 20,
    dateLabel: '20 Oct',
    category: 'Special Occasion',
    aiIdea: 'Promote special gifting, celebration packages, or festive offers for families.',
    defaultCoupon: 'KARWA15',
  },
  {
    id: 'fest-dhanteras',
    name: 'Dhanteras Prosperity',
    monthIndex: 9,
    day: 29,
    dateLabel: '29 Oct',
    category: 'Muhurat & Auspicious',
    aiIdea: 'Invite customers for auspicious Dhanteras bookings or purchases with festive rewards.',
    defaultCoupon: 'DHANTERAS',
  },
  {
    id: 'fest-diwali',
    name: 'Diwali Festival of Lights',
    monthIndex: 9,
    day: 31,
    dateLabel: '31 Oct',
    category: 'Major Festival',
    aiIdea: 'Launch your Diwali campaign with warm greetings and exclusive festival discounts.',
    defaultCoupon: 'DIWALI25',
  },
  {
    id: 'fest-bhaidooj',
    name: 'Bhai Dooj Celebration',
    monthIndex: 10,
    day: 3,
    dateLabel: '3 Nov',
    category: 'Family Festival',
    aiIdea: 'Celebrate the bond of brother and sister with thoughtful gift vouchers and family packages.',
    defaultCoupon: 'BHAIDOOJ20',
  },
  {
    id: 'fest-chhath',
    name: 'Chhath Puja Greetings',
    monthIndex: 10,
    day: 7,
    dateLabel: '7 Nov',
    category: 'Cultural & Devotional',
    aiIdea: 'Share warm Chhath Puja wishes and community offers to build strong local trust.',
    defaultCoupon: 'CHHATH15',
  },
  {
    id: 'fest-christmas',
    name: 'Christmas & Year-End',
    monthIndex: 11,
    day: 25,
    dateLabel: '25 Dec',
    category: 'Holiday Season',
    aiIdea: 'Run a Year-End Holiday Special to attract December shoppers and clients.',
    defaultCoupon: 'XMAS25',
  },
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const PostsScreen: React.FC = () => {
  const { user } = useAuth();
  const { locations, selectedLocation, selectLocation, isSyncingLocation } = useGoogle();
  const {
    schedulePost,
    deletePost,
    filteredPosts,
    n8nWebhookUrl,
    updateWebhookUrl,
    testWebhook,
  } = usePosts();
  const { connectors, connectAccount, disconnectAccount } = useSocial();

  // Calendar month/year state
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

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
  const [ctaUrl, setCtaUrl] = useState(selectedLocation?.websiteUri || '');
  const [couponCode, setCouponCode] = useState(UPCOMING_FESTIVALS[4].defaultCoupon);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Social Login Modal State
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'facebook' | 'linkedin' | null>(
    null
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // n8n Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempWebhookUrl, setTempWebhookUrl] = useState(n8nWebhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setBusinessCategoryInput(selectedLocation?.categories?.primaryCategory?.displayName || '');
    setCtaUrl(selectedLocation?.websiteUri || '');
  }, [
    selectedLocation?.id,
    selectedLocation?.categories?.primaryCategory?.displayName,
    selectedLocation?.websiteUri,
  ]);

  // Build calendar cells (Monday-first grid)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const leadingEmptyDays = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: Array<number | null> = [];
    for (let i = 0; i < leadingEmptyDays; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [calendarYear, calendarMonth]);

  // Determine badge color for each day in the active month
  const getDayStatus = (day: number): 'posted' | 'approved' | 'generated' | null => {
    // Check user's scheduled/published posts for this location first
    const matchingPost = filteredPosts.find((p) => {
      const dt = new Date(p.scheduledTime);
      return (
        dt.getFullYear() === calendarYear &&
        dt.getMonth() === calendarMonth &&
        dt.getDate() === day
      );
    });
    if (matchingPost) {
      if (matchingPost.status === 'published') return 'posted';
      if (matchingPost.status === 'scheduled') return 'approved';
    }

    // Check real festival dates
    const fest = UPCOMING_FESTIVALS.find(
      (f) => f.monthIndex === calendarMonth && f.day === day
    );
    if (fest) {
      return 'generated';
    }

    return null;
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const festOnDay = UPCOMING_FESTIVALS.find(
      (f) => f.monthIndex === calendarMonth && f.day === day
    );
    if (festOnDay) {
      setSelectedFestival(festOnDay);
      setCouponCode(festOnDay.defaultCoupon);
    }
  };

  const handleSelectFestival = (fest: FestivalEvent) => {
    setSelectedFestival(fest);
    setCalendarMonth(fest.monthIndex);
    setSelectedDay(fest.day);
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
      Alert.alert('Post Generator', e.message || 'Could not generate post');
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
        'Tap "Generate Poster & Caption" first or write your post text below.'
      );
      return;
    }

    setIsSubmitting(true);
    const scheduledTime = publishImmediately
      ? Date.now()
      : new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime();

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
      Alert.alert('Post Saved', result.message);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  // Social Media Connect Handlers
  const handleOpenSocialConnect = (platform: 'instagram' | 'facebook' | 'linkedin') => {
    const existing = connectors.find((c) => c.platform === platform);
    if (existing?.connected) {
      Alert.alert(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected`,
        `Connected as ${existing.handle} (${existing.connectedEmail || 'Active'})`,
        [
          { text: 'Keep Connected', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => disconnectAccount(existing.id),
          },
        ]
      );
      return;
    }
    setActivePlatform(platform);
    setLoginEmail(user?.email || '');
    setLoginPassword('');
    setAccountHandle('');
  };

  const handleConfirmSocialConnect = async () => {
    if (!activePlatform) return;
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      Alert.alert('Email Required', 'Please enter the email address for your social account.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your account password or token.');
      return;
    }

    setIsAuthenticating(true);
    const emailPrefix = loginEmail.trim().split('@')[0];
    const finalName = `${emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)}`;
    const finalHandle =
      accountHandle.trim() || (activePlatform === 'instagram' ? `@${emailPrefix}` : finalName);

    setTimeout(async () => {
      await connectAccount(activePlatform, finalName, finalHandle, loginEmail.trim());
      setIsAuthenticating(false);
      setActivePlatform(null);
    }, 500);
  };

  const handleLaunchBrowserOAuth = async () => {
    if (!activePlatform) return;
    const urls: Record<string, string> = {
      facebook: 'https://www.facebook.com/login.php',
      instagram: 'https://www.instagram.com/accounts/login/',
      linkedin: 'https://www.linkedin.com/login',
    };
    try {
      await WebBrowser.openBrowserAsync(urls[activePlatform] || 'https://google.com');
    } catch {
      // ignore
    }
  };

  const scheduledPostsForLocation = filteredPosts.filter((p) => p.status === 'scheduled').length;

  return (
    <ScrollView
      style={{ backgroundColor: '#F3F5F9' }}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Active GMB Location Switcher Bar */}
      {locations.length > 0 && (
        <View className="bg-white px-5 pt-3.5 pb-3.5 border-b border-slate-100 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Business Location ({locations.length})
            </Text>
            {isSyncingLocation ? (
              <Text className="text-[11px] font-medium text-blue-600">Syncing location...</Text>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {locations.map((loc) => {
              const active = selectedLocation?.id === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => selectLocation(loc.id)}
                  style={{
                    backgroundColor: active ? '#131A38' : '#F8FAFC',
                    borderColor: active ? '#131A38' : '#E2E8F0',
                    borderWidth: 1,
                  }}
                  className="mr-2 px-3.5 py-2 rounded-xl flex-row items-center"
                >
                  <MapPin size={12} color={active ? '#FFFFFF' : '#475569'} />
                  <Text
                    style={{ color: active ? '#FFFFFF' : '#1E293B' }}
                    className="text-xs font-semibold ml-1.5"
                    numberOfLines={1}
                  >
                    {loc.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: CLEAN SOCIAL CALENDAR (MATCHING REFERENCE SCREENSHOT 1)   */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-6 pb-6 mb-3">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text style={{ color: '#4A4E58' }} className="text-[21px] font-bold">
              Social Calendar
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {selectedLocation?.title || 'Select a Google Business location'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setTempWebhookUrl(n8nWebhookUrl);
              setTestResult(null);
              setShowConfigModal(true);
            }}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-slate-100"
          >
            <Settings size={13} color="#64748b" />
            <Text className="text-xs text-slate-600 font-medium ml-1.5">Automation</Text>
          </Pressable>
        </View>

        {/* Warm Purple-to-Orange Action Banner */}
        <Pressable
          onPress={handleGenerateFestivalPost}
          style={{ backgroundColor: '#C85A53' }}
          className="rounded-xl px-4 py-3.5 flex-row items-center justify-between mb-6 overflow-hidden"
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '52%',
              backgroundColor: '#9B4DCA',
              opacity: 0.85,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '60%',
              backgroundColor: '#EA6336',
              opacity: 0.9,
            }}
          />
          <View className="flex-row items-center z-10 flex-1 mr-2">
            <Clock size={18} color="#ffffff" />
            <Text className="text-white text-[13px] font-medium ml-2.5 flex-1" numberOfLines={1}>
              {scheduledPostsForLocation > 0
                ? `${scheduledPostsForLocation} scheduled ${
                    scheduledPostsForLocation === 1 ? 'post' : 'posts'
                  } for ${selectedLocation?.title || 'this location'}`
                : `Tap to generate ${selectedFestival.name} poster`}
            </Text>
          </View>
          <ChevronRight size={20} color="#ffffff" />
        </Pressable>

        {/* Month Selector Row */}
        <View className="flex-row items-center justify-between px-4 mb-6">
          <Pressable
            onPress={handlePrevMonth}
            style={{ borderColor: '#E5989B', borderWidth: 1.5 }}
            className="w-11 h-11 rounded-full items-center justify-center"
          >
            <ChevronLeft size={20} color="#D96B66" />
          </Pressable>

          <Text className="text-[20px] font-bold text-slate-900">
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>

          <Pressable
            onPress={handleNextMonth}
            style={{ borderColor: '#E5989B', borderWidth: 1.5 }}
            className="w-11 h-11 rounded-full items-center justify-center"
          >
            <ChevronRight size={20} color="#D96B66" />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View className="flex-row mb-3">
          {WEEKDAYS.map((dayName) => (
            <View key={dayName} className="flex-1 items-center">
              <Text className="text-[12px] font-medium text-slate-600">{dayName}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days Grid */}
        <View className="flex-row flex-wrap mb-4">
          {calendarCells.map((dayNum, index) => {
            if (dayNum === null) {
              return <View key={`empty-${index}`} style={{ width: '14.28%' }} className="h-12" />;
            }

            const status = getDayStatus(dayNum);
            const isSelected = selectedDay === dayNum;

            let circleBg = 'transparent';
            let textColor = '#1E293B';

            if (status === 'posted') {
              circleBg = '#1E8E3E';
              textColor = '#FFFFFF';
            } else if (status === 'generated') {
              circleBg = '#F4B400';
              textColor = '#FFFFFF';
            } else if (status === 'approved') {
              circleBg = '#2563EB';
              textColor = '#FFFFFF';
            } else if (isSelected) {
              circleBg = '#F1F5F9';
              textColor = '#0F172A';
            }

            return (
              <Pressable
                key={`day-${dayNum}`}
                onPress={() => handleSelectDay(dayNum)}
                style={{ width: '14.28%' }}
                className="h-12 items-center justify-center"
              >
                <View
                  style={{
                    backgroundColor: circleBg,
                    borderWidth: isSelected && !status ? 1.5 : 0,
                    borderColor: '#94A3B8',
                  }}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <Text
                    style={{ color: textColor }}
                    className="text-[15px] font-medium"
                  >
                    {dayNum}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Subtle Divider */}
        <View className="h-[1px] bg-slate-100 my-3" />

        {/* Status Legend Pills */}
        <View className="flex-row flex-wrap items-center justify-center gap-2.5 mt-2">
          <View
            style={{ backgroundColor: '#FEF9E7' }}
            className="flex-row items-center px-3.5 py-1.5 rounded-full"
          >
            <View style={{ backgroundColor: '#F4B400' }} className="w-2.5 h-2.5 rounded-full mr-2" />
            <Text style={{ color: '#785A08' }} className="text-xs font-medium">
              Generated
            </Text>
          </View>

          <View
            style={{ backgroundColor: '#EFF6FF' }}
            className="flex-row items-center px-3.5 py-1.5 rounded-full"
          >
            <View style={{ backgroundColor: '#2563EB' }} className="w-2.5 h-2.5 rounded-full mr-2" />
            <Text style={{ color: '#1E40AF' }} className="text-xs font-medium">
              Approved
            </Text>
          </View>

          <View
            style={{ backgroundColor: '#ECFDF3' }}
            className="flex-row items-center px-3.5 py-1.5 rounded-full"
          >
            <View style={{ backgroundColor: '#1E8E3E' }} className="w-2.5 h-2.5 rounded-full mr-2" />
            <Text style={{ color: '#166534' }} className="text-xs font-medium">
              Posted
            </Text>
          </View>

          <View
            style={{ backgroundColor: '#F3F4F6' }}
            className="flex-row items-center px-3.5 py-1.5 rounded-full"
          >
            <View style={{ backgroundColor: '#71717A' }} className="w-2.5 h-2.5 rounded-full mr-2" />
            <Text style={{ color: '#52525B' }} className="text-xs font-medium">
              No Post
            </Text>
          </View>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* SECTION 2: STAY ACTIVE ON SOCIAL MEDIA (MATCHING SCREENSHOT 2)       */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-6 pb-6 mb-3">
        <Text style={{ color: '#4A4E58' }} className="text-[21px] font-bold mb-1">
          Stay active on Social Media
        </Text>
        <Text className="text-slate-500 text-[14px] mb-5">
          Connect profiles to automate marketing
        </Text>

        {/* Facebook Card */}
        {(() => {
          const fb = connectors.find((c) => c.platform === 'facebook');
          return (
            <Pressable
              onPress={() => handleOpenSocialConnect('facebook')}
              style={{ borderColor: '#EEF1F6', borderWidth: 1.2 }}
              className="bg-white rounded-2xl p-4 mb-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ backgroundColor: '#1877F2' }}
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                >
                  <Text className="text-white font-bold text-2xl">f</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-[17px]">Facebook</Text>
                  <Text
                    style={{ color: fb?.connected ? '#1E8E3E' : '#8E95A2' }}
                    className="text-[13px] mt-0.5"
                    numberOfLines={1}
                  >
                    {fb?.connected ? `Connected (${fb.handle})` : 'Not connected'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Text style={{ color: '#E05A67' }} className="text-[15px] font-medium mr-1">
                  {fb?.connected ? 'Manage' : 'Connect'}
                </Text>
                <ChevronRight size={17} color="#E05A67" />
              </View>
            </Pressable>
          );
        })()}

        {/* Instagram Card */}
        {(() => {
          const ig = connectors.find((c) => c.platform === 'instagram');
          return (
            <Pressable
              onPress={() => handleOpenSocialConnect('instagram')}
              style={{ borderColor: '#EEF1F6', borderWidth: 1.2 }}
              className="bg-white rounded-2xl p-4 mb-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ borderColor: '#F1F3F7', borderWidth: 1.5 }}
                  className="w-12 h-12 rounded-full bg-white items-center justify-center mr-4"
                >
                  <Camera size={24} color="#C13584" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-[17px]">Instagram</Text>
                  <Text
                    style={{ color: ig?.connected ? '#1E8E3E' : '#8E95A2' }}
                    className="text-[13px] mt-0.5"
                    numberOfLines={1}
                  >
                    {ig?.connected ? `Connected (${ig.handle})` : 'Not connected'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Text style={{ color: '#E05A67' }} className="text-[15px] font-medium mr-1">
                  {ig?.connected ? 'Manage' : 'Connect'}
                </Text>
                <ChevronRight size={17} color="#E05A67" />
              </View>
            </Pressable>
          );
        })()}

        {/* LinkedIn Card */}
        {(() => {
          const li = connectors.find((c) => c.platform === 'linkedin');
          return (
            <Pressable
              onPress={() => handleOpenSocialConnect('linkedin')}
              style={{ borderColor: '#EEF1F6', borderWidth: 1.2 }}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ backgroundColor: '#0A66C2' }}
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                >
                  <Text className="text-white font-bold text-lg">in</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-[17px]">LinkedIn</Text>
                  <Text
                    style={{ color: li?.connected ? '#1E8E3E' : '#8E95A2' }}
                    className="text-[13px] mt-0.5"
                    numberOfLines={1}
                  >
                    {li?.connected ? `Connected (${li.handle})` : 'Not connected'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Text style={{ color: '#E05A67' }} className="text-[15px] font-medium mr-1">
                  {li?.connected ? 'Manage' : 'Connect'}
                </Text>
                <ChevronRight size={17} color="#E05A67" />
              </View>
            </Pressable>
          );
        })()}
      </View>

      {/* ==================================================================== */}
      {/* SECTION 3: CLEAN FESTIVAL & CAMPAIGN POST STUDIO                     */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-6 pb-6 mb-3">
        <Text style={{ color: '#4A4E58' }} className="text-[20px] font-bold mb-1">
          Create & Approve Campaign Poster
        </Text>
        <Text className="text-slate-500 text-[13px] mb-4">
          Select an upcoming occasion and generate a tailored poster for your business
        </Text>

        {/* Occasion Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
          {UPCOMING_FESTIVALS.map((fest) => {
            const active = selectedFestival.id === fest.id;
            return (
              <Pressable
                key={fest.id}
                onPress={() => handleSelectFestival(fest)}
                style={{
                  backgroundColor: active ? '#131A38' : '#F8FAFC',
                  borderColor: active ? '#131A38' : '#E2E8F0',
                  borderWidth: 1,
                }}
                className="mr-2.5 px-3.5 py-2.5 rounded-xl"
              >
                <Text
                  style={{ color: active ? '#FFFFFF' : '#1E293B' }}
                  className="text-xs font-semibold"
                >
                  {fest.name}
                </Text>
                <Text
                  style={{ color: active ? '#CBD5E1' : '#64748B' }}
                  className="text-[11px] mt-0.5"
                >
                  {fest.dateLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Clean Business Category & Offer Inputs */}
        <View
          style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1 }}
          className="p-4 rounded-2xl mb-4"
        >
          <Text className="text-xs font-semibold text-slate-700 mb-1.5">
            Business Category (used to design relevant poster visuals)
          </Text>
          <TextInput
            value={businessCategoryInput}
            onChangeText={setBusinessCategoryInput}
            placeholder="e.g. Digital Marketing Agency, Salon, Jewellery Store, Clinic"
            placeholderTextColor="#94a3b8"
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 mb-3"
          />

          <Text className="text-xs font-semibold text-slate-700 mb-1.5">
            Special Offer or Highlight (optional)
          </Text>
          <TextInput
            value={customTopicInput}
            onChangeText={setCustomTopicInput}
            placeholder={`e.g. Flat 20% off for ${selectedFestival.name}`}
            placeholderTextColor="#94a3b8"
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 mb-3.5"
          />

          <Pressable
            onPress={handleGenerateFestivalPost}
            disabled={isGeneratingAI}
            style={{ backgroundColor: '#131A38' }}
            className="py-3.5 rounded-xl flex-row items-center justify-center"
          >
            {isGeneratingAI ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Sparkles size={16} color="#ffffff" />
            )}
            <Text className="text-white font-semibold text-sm ml-2">
              {isGeneratingAI
                ? 'Designing Poster & Captions...'
                : `Generate ${selectedFestival.name} Poster`}
            </Text>
          </Pressable>
        </View>

        {/* Poster Preview */}
        {mediaUrl ? (
          <View className="mb-4">
            <View className="rounded-2xl overflow-hidden h-52 bg-slate-100 relative border border-slate-200">
              <Image
                source={{ uri: mediaUrl }}
                className="w-full h-full"
                resizeMode="cover"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
              />
              {isImageLoading && (
                <View className="absolute inset-0 bg-slate-900/50 items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-xs font-medium text-white mt-2">
                    Preparing custom poster...
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-3.5 py-2.5 flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-white" numberOfLines={1}>
                  {selectedFestival.name} • {selectedLocation?.title || businessCategoryInput}
                </Text>
                <Pressable
                  onPress={handleRegenerateImageFromPrompt}
                  className="bg-white/20 px-2.5 py-1 rounded-full flex-row items-center"
                >
                  <RefreshCw size={11} color="#ffffff" />
                  <Text className="text-[11px] text-white font-medium ml-1">New Design</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* Caption Tabs */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl mb-2.5">
          <Pressable
            onPress={() => setActiveCaptionTab('gmb')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeCaptionTab === 'gmb' ? 'bg-white' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeCaptionTab === 'gmb' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Google Business Update
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveCaptionTab('social')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeCaptionTab === 'social' ? 'bg-white' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeCaptionTab === 'social' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Social Media Caption
            </Text>
          </Pressable>
        </View>

        <TextInput
          multiline
          numberOfLines={4}
          value={activeCaptionTab === 'gmb' ? gmbSummary : socialCaption}
          onChangeText={activeCaptionTab === 'gmb' ? setGmbSummary : setSocialCaption}
          placeholder="Tap 'Generate Poster' above or write your post caption here..."
          placeholderTextColor="#94a3b8"
          className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 mb-3.5 min-h-[96px]"
          textAlignVertical="top"
        />

        {/* Target Channels */}
        <Text className="text-xs font-semibold text-slate-600 mb-2">Publish Channels</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(['gmb', 'facebook', 'instagram', 'linkedin'] as PostChannel[]).map((ch) => {
            const active = selectedChannels.includes(ch);
            return (
              <Pressable
                key={ch}
                onPress={() => toggleChannel(ch)}
                style={{
                  backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                  borderColor: active ? '#93C5FD' : '#E2E8F0',
                  borderWidth: 1,
                }}
                className="px-3 py-2 rounded-xl flex-row items-center"
              >
                <CheckCircle size={14} color={active ? '#2563EB' : '#94A3B8'} />
                <Text
                  className={`text-xs font-medium ml-1.5 capitalize ${
                    active ? 'text-blue-900' : 'text-slate-500'
                  }`}
                >
                  {ch === 'gmb' ? 'Google Profile' : ch}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Approve / Publish Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => handleCreatePost(false)}
            disabled={isSubmitting}
            style={{ borderColor: '#CBD5E1', borderWidth: 1 }}
            className="flex-1 py-3.5 rounded-xl items-center justify-center bg-white"
          >
            <Text className="text-slate-800 font-semibold text-sm">Approve & Schedule</Text>
          </Pressable>

          <Pressable
            onPress={() => handleCreatePost(true)}
            disabled={isSubmitting}
            style={{ backgroundColor: '#1E8E3E' }}
            className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center"
          >
            <Send size={15} color="#ffffff" />
            <Text className="text-white font-semibold text-sm ml-2">Post Now</Text>
          </Pressable>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* SECTION 4: SCHEDULED & PUBLISHED POSTS LIST                          */}
      {/* ==================================================================== */}
      {filteredPosts.length > 0 && (
        <View className="bg-white px-5 pt-5 pb-6">
          <Text style={{ color: '#4A4E58' }} className="text-[18px] font-bold mb-3">
            Approved & Posted Updates ({filteredPosts.length})
          </Text>
          {filteredPosts.map((post) => (
            <View
              key={post.id}
              style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
              className="p-3.5 rounded-2xl mb-3 flex-row items-start justify-between"
            >
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <View
                    style={{
                      backgroundColor: post.status === 'published' ? '#ECFDF3' : '#EFF6FF',
                    }}
                    className="px-2.5 py-0.5 rounded-full mr-2"
                  >
                    <Text
                      style={{
                        color: post.status === 'published' ? '#166534' : '#1E40AF',
                      }}
                      className="text-[11px] font-medium capitalize"
                    >
                      {post.status === 'published' ? 'Posted' : 'Approved'}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-400">
                    {new Date(post.scheduledTime).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Text className="text-xs text-slate-700 leading-relaxed" numberOfLines={3}>
                  {post.summary}
                </Text>
              </View>
              <Pressable onPress={() => deletePost(post.id)} className="p-1.5">
                <Trash2 size={16} color="#94a3b8" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: SOCIAL MEDIA ACCOUNT LOGIN                                  */}
      {/* ==================================================================== */}
      <Modal visible={Boolean(activePlatform)} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-slate-900 capitalize">
                Connect {activePlatform}
              </Text>
              <Pressable onPress={() => setActivePlatform(null)}>
                <Text className="text-sm font-medium text-slate-500">Close</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-slate-500 mb-4 leading-relaxed">
              Sign in with the email address linked to your {activePlatform} profile to automate
              poster publishing.
            </Text>

            <Pressable
              onPress={handleLaunchBrowserOAuth}
              className="flex-row items-center justify-center bg-slate-100 border border-slate-200 py-3 px-4 rounded-xl mb-4"
            >
              <ExternalLink size={15} color="#1e293b" />
              <Text className="text-xs font-semibold text-slate-800 ml-2 capitalize">
                Open {activePlatform} Login in Browser
              </Text>
            </Pressable>

            <Text className="text-xs font-medium text-slate-700 mb-1">Account Email</Text>
            <TextInput
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-medium text-slate-700 mb-1">Password or Access Token</Text>
            <TextInput
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-medium text-slate-700 mb-1">
              Page Name or Handle (optional)
            </Text>
            <TextInput
              value={accountHandle}
              onChangeText={setAccountHandle}
              placeholder={activePlatform === 'instagram' ? '@yourbusiness' : 'Your Business Page'}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-4"
            />

            <Pressable
              onPress={handleConfirmSocialConnect}
              disabled={isAuthenticating}
              style={{ backgroundColor: '#131A38' }}
              className="py-3.5 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-semibold text-sm">
                {isAuthenticating ? 'Connecting...' : `Connect ${activePlatform}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: N8N AUTOMATION WEBHOOK SETTINGS                             */}
      {/* ==================================================================== */}
      <Modal visible={showConfigModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-slate-900">n8n Automation Endpoint</Text>
              <Pressable onPress={() => setShowConfigModal(false)}>
                <Text className="text-sm font-medium text-slate-500">Close</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-slate-500 mb-3">
              Enter your n8n Webhook URL to automatically publish approved posters to Google
              Business Profile, Facebook, Instagram, and LinkedIn.
            </Text>

            <TextInput
              value={tempWebhookUrl}
              onChangeText={setTempWebhookUrl}
              placeholder="https://your-n8n.app.n8n.cloud/webhook/digilocal-post"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mb-3"
            />

            {testResult && (
              <View className="p-3 rounded-xl bg-slate-100 mb-3">
                <Text className="text-xs text-slate-700">{testResult}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={async () => {
                  await updateWebhookUrl(tempWebhookUrl);
                  setIsTestingWebhook(true);
                  const res = await testWebhook();
                  setIsTestingWebhook(false);
                  setTestResult(res.message);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-300 items-center"
              >
                <Text className="text-xs font-semibold text-slate-700">
                  {isTestingWebhook ? 'Testing...' : 'Test Connection'}
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await updateWebhookUrl(tempWebhookUrl);
                  setShowConfigModal(false);
                }}
                style={{ backgroundColor: '#131A38' }}
                className="flex-1 py-3 rounded-xl items-center"
              >
                <Text className="text-xs font-semibold text-white">Save Endpoint</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
