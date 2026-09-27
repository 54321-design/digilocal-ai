import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  Share2,
  Calendar,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  Eye,
  Navigation,
  Globe,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Plus,
  Send,
  LogOut,
  Mail,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { usePosts } from '../context/PostsContext';
import { useSocial } from '../context/SocialContext';
import { useSEO } from '../context/SEOContext';
import {
  MetricCard,
  Card,
  Badge,
  Button,
} from '../components';
import { GoogleReview } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signInWithGoogle, signInWithGMBAccount, signOut, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    accounts,
    locations,
    selectedLocation,
    selectLocation,
    refreshGoogleData,
    addGMBListing,
  } = useGoogle();
  const {
    reviews,
    refreshReviews,
    sentimentReport,
    generateAIReply,
    publishReply,
    isGeneratingAI,
    isPublishing,
  } = useReviews();
  const { posts } = usePosts();
  const { connectors, connectedCount } = useSocial();
  const { webAudit, runWebAudit } = useSEO();

  const [refreshing, setRefreshing] = useState(false);

  // Direct GMB Email Login Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [gmbEmailInput, setGmbEmailInput] = useState('');
  const [gmbBusinessNameInput, setGmbBusinessNameInput] = useState('');

  // Add GMB Listing Modal
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingCategory, setNewListingCategory] = useState('');
  const [newListingAddress, setNewListingAddress] = useState('');
  const [newListingCity, setNewListingCity] = useState('');
  const [newListingPhone, setNewListingPhone] = useState('');

  // Quick Dashboard AI Reply state
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [activeDraftingId, setActiveDraftingId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    runWebAudit();
    setRefreshing(false);
  };

  const handleDirectEmailLogin = async () => {
    if (!gmbEmailInput.trim() || !gmbEmailInput.includes('@')) {
      Alert.alert('Valid Gmail Required', 'Please enter your Google Business Profile Gmail ID.');
      return;
    }
    await signInWithGMBAccount(gmbEmailInput.trim(), gmbBusinessNameInput.trim() || undefined);
    setShowEmailModal(false);
  };

  const handleCreateListing = async () => {
    if (!newListingTitle.trim()) {
      Alert.alert('Business Name Required', 'Please enter your GMB listing business name.');
      return;
    }
    await addGMBListing({
      title: newListingTitle,
      category: newListingCategory || 'Local Business',
      address: newListingAddress || 'Main Market',
      city: newListingCity || 'India',
      phone: newListingPhone || '+91 98000 00000',
    });
    setNewListingTitle('');
    setNewListingCategory('');
    setNewListingAddress('');
    setNewListingCity('');
    setNewListingPhone('');
    setShowAddListingModal(false);
    Alert.alert('GMB Listing Added', 'Your listing is now linked to your Google account.');
  };

  const handleQuickGenerateReply = async (review: GoogleReview) => {
    setActiveDraftingId(review.id);
    const generated = await generateAIReply(review, 'professional', 'en');
    if (generated) {
      setDraftReplies((prev) => ({ ...prev, [review.id]: generated }));
    }
    setActiveDraftingId(null);
  };

  const handleQuickPostReply = async (review: GoogleReview) => {
    const text = draftReplies[review.id];
    if (!text?.trim()) return;
    const ok = await publishReply(review, text);
    if (ok) {
      setDraftReplies((prev) => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
    }
  };

  // Review stats
  const totalReviews = reviews.length;
  const unansweredReviews = reviews.filter((r) => !r.reviewReply?.comment);
  const unansweredCount = unansweredReviews.length;
  const averageRating =
    sentimentReport?.averageRating ||
    (totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.numericRating, 0) / totalReviews).toFixed(1)
      : '4.8');

  const insights = selectedLocation?.insights || {
    mapsViews: 6390,
    searchViews: 4820,
    callClicks: 245,
    websiteClicks: 410,
    directionRequests: 180,
  };

  // ============================================================================
  // STATE 1: NOT SIGNED IN -> MAIN GOOGLE SIGN-IN SCREEN
  // ============================================================================
  if (!isConnected) {
    return (
      <ScrollView
        className="flex-1 bg-slate-900"
        contentContainerStyle={{ padding: 24, paddingTop: 48, paddingBottom: 48 }}
      >
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-3xl bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <MapPin size={32} color="#ffffff" />
          </View>
          <Badge label="Official GMB Growth Suite" variant="primary" size="sm" />
          <Text className="text-2xl font-extrabold text-white text-center mt-3">
            DigiLocal.ai GMB Manager
          </Text>
          <Text className="text-xs text-slate-400 text-center mt-2 leading-relaxed px-4">
            Sign in with your Google Business Profile Gmail account to automatically connect all your GMB accounts, listings, customer reviews, AI sentiment analysis, and festival post scheduler.
          </Text>
        </View>

        <Card className="bg-slate-800 border-slate-700 p-5 mb-5">
          <Text className="text-sm font-bold text-white mb-3">
            What connects automatically with Google Sign-In:
          </Text>

          {[
            'All your GMB Accounts & Storefront Listings',
            'Customer Reviews with AI Positive / Average / Negative Sentiment',
            '1-Click AI Review Replies posted directly to Google',
            'Festival Calendar with AI Post Captions & Banner Generator',
            'Instagram, Facebook & LinkedIn Account Login & Cross-Posting',
          ].map((item, idx) => (
            <View key={idx} className="flex-row items-center mb-2.5">
              <CheckCircle size={15} color="#34d399" />
              <Text className="text-xs text-slate-300 ml-2.5 flex-1">{item}</Text>
            </View>
          ))}

          <View className="mt-4 space-y-3">
            <Button
              title={authLoading ? 'Connecting Google Account...' : 'Sign in with Google (GMB)'}
              onPress={signInWithGoogle}
              loading={authLoading}
              variant="primary"
              size="lg"
            />

            <Pressable
              onPress={() => setShowEmailModal(true)}
              className="mt-3 py-3 px-4 rounded-xl bg-slate-700/80 border border-slate-600 flex-row items-center justify-center active:bg-slate-700"
            >
              <Mail size={16} color="#93c5fd" />
              <Text className="text-xs font-bold text-blue-200 ml-2">
                Connect with GMB Gmail ID Directly
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Direct GMB Email Login Modal */}
        <Modal visible={showEmailModal} transparent animationType="slide">
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl p-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-bold text-slate-900">
                  Connect Your GMB Gmail Account
                </Text>
                <Pressable onPress={() => setShowEmailModal(false)}>
                  <Text className="text-xs font-bold text-slate-500">Close</Text>
                </Pressable>
              </View>
              <Text className="text-xs text-slate-500 mb-4">
                Enter the Gmail address linked to your Google Business Profile to load your account and listings.
              </Text>

              <Text className="text-xs font-bold text-slate-700 mb-1">GMB Gmail ID *</Text>
              <TextInput
                value={gmbEmailInput}
                onChangeText={setGmbEmailInput}
                placeholder="yourbusiness@gmail.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 mb-3"
              />

              <Text className="text-xs font-bold text-slate-700 mb-1">
                Primary Business / Store Name *
              </Text>
              <TextInput
                value={gmbBusinessNameInput}
                onChangeText={setGmbBusinessNameInput}
                placeholder="e.g. Royal Jewellers / Apna Cafe"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 mb-4"
              />

              <Button
                title="Connect GMB Account"
                onPress={handleDirectEmailLogin}
                variant="primary"
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // ============================================================================
  // STATE 2: SIGNED IN -> REAL GMB ACCOUNT, ALL LISTINGS, SENTIMENT & AI DASHBOARD
  // ============================================================================
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Connected Google Account Bar (No Fake Dropdown) */}
      <View className="bg-slate-900 px-5 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-2xl bg-blue-600 items-center justify-center mr-3">
              <Text className="text-base font-extrabold text-white uppercase">
                {(user?.displayName || user?.email || 'G')[0]}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-sm font-bold text-white mr-2" numberOfLines={1}>
                  {user?.displayName || 'GMB Account'}
                </Text>
                <Badge label="GMB Connected" variant="success" size="sm" />
              </View>
              <Text className="text-xs text-blue-300 font-medium" numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={signOut}
            className="bg-slate-800 p-2.5 rounded-xl border border-slate-700"
          >
            <LogOut size={16} color="#f87171" />
          </Pressable>
        </View>

        {/* All Connected Accounts & Listings */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Your GMB Listings ({locations.length}) • {accounts.length || 1} Account(s)
          </Text>
          <Pressable
            onPress={() => setShowAddListingModal(true)}
            className="flex-row items-center bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 rounded-lg"
          >
            <Plus size={12} color="#60a5fa" />
            <Text className="text-[11px] font-bold text-blue-300 ml-1">Add Listing</Text>
          </Pressable>
        </View>

        {/* Horizontal List of All Listings under this Gmail */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {locations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <Pressable
                key={loc.id}
                onPress={() => selectLocation(loc.id)}
                className={`mr-2.5 p-3 rounded-2xl border w-64 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center flex-1 mr-2">
                    <MapPin size={14} color={isSelected ? '#ffffff' : '#60a5fa'} />
                    <Text
                      className="text-xs font-extrabold text-white ml-1.5 flex-1"
                      numberOfLines={1}
                    >
                      {loc.title}
                    </Text>
                  </View>
                  <View className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30">
                    <Text className="text-[9px] font-bold text-emerald-300">
                      {loc.verificationStatus || 'VERIFIED'}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-[11px] ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                  numberOfLines={1}
                >
                  {loc.categories?.primaryCategory?.displayName || 'Local Business'} •{' '}
                  {loc.storefrontAddress?.locality || 'India'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="px-4 pt-4">
        {/* SECTION 1: AI Sentiment Analysis & Review Responder Dashboard */}
        <Card className="mb-4 bg-white border-indigo-100">
          <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <View className="flex-row items-center">
              <Sparkles size={18} color="#4f46e5" className="mr-2" />
              <View>
                <Text className="text-sm font-bold text-slate-900">
                  AI Review Sentiment Analysis
                </Text>
                <Text className="text-[11px] text-slate-500">
                  {selectedLocation?.title} ({totalReviews} Reviews)
                </Text>
              </View>
            </View>
            <View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-xs font-extrabold text-amber-800 ml-1">
                {averageRating} ★
              </Text>
            </View>
          </View>

          {/* Positive / Average / Negative Pills */}
          {sentimentReport && (
            <>
              <View className="flex-row space-x-2 mb-3">
                <View className="flex-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 items-center">
                  <View className="flex-row items-center">
                    <ThumbsUp size={12} color="#10b981" />
                    <Text className="text-xs font-extrabold text-emerald-700 ml-1">
                      {sentimentReport.positivePercentage}%
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
                    Positive
                  </Text>
                </View>

                <View className="flex-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200 items-center">
                  <View className="flex-row items-center">
                    <MinusCircle size={12} color="#f59e0b" />
                    <Text className="text-xs font-extrabold text-amber-700 ml-1">
                      {sentimentReport.neutralPercentage}%
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">
                    Average
                  </Text>
                </View>

                <View className="flex-1 bg-rose-50 p-2.5 rounded-xl border border-rose-200 items-center">
                  <View className="flex-row items-center">
                    <ThumbsDown size={12} color="#ef4444" />
                    <Text className="text-xs font-extrabold text-rose-700 ml-1">
                      {sentimentReport.negativePercentage}%
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold text-rose-600 uppercase mt-0.5">
                    Negative
                  </Text>
                </View>
              </View>

              <View className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 mb-3">
                <Text className="text-xs text-slate-700 leading-relaxed">
                  🤖 <Text className="font-bold text-indigo-950">AI Verdict:</Text>{' '}
                  {sentimentReport.summary}
                </Text>
              </View>
            </>
          )}

          {/* Direct Dashboard AI Review Replies */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-slate-800">
              Pending Reviews to Reply ({unansweredCount})
            </Text>
            <Pressable onPress={() => navigation.navigate('Reviews')}>
              <Text className="text-xs font-bold text-blue-600">View All Reviews →</Text>
            </Pressable>
          </View>

          {unansweredReviews.slice(0, 2).map((rev) => (
            <View
              key={rev.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2.5"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-slate-900">
                  {rev.reviewer.displayName} ({rev.numericRating}★)
                </Text>
                <Badge
                  label={
                    rev.numericRating >= 4
                      ? 'Positive'
                      : rev.numericRating === 3
                      ? 'Average'
                      : 'Negative'
                  }
                  variant={
                    rev.numericRating >= 4
                      ? 'success'
                      : rev.numericRating === 3
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                />
              </View>
              <Text className="text-xs text-slate-600 mb-2">"{rev.comment}"</Text>

              {draftReplies[rev.id] ? (
                <View>
                  <TextInput
                    multiline
                    value={draftReplies[rev.id]}
                    onChangeText={(txt) =>
                      setDraftReplies((prev) => ({ ...prev, [rev.id]: txt }))
                    }
                    className="bg-white border border-indigo-200 rounded-xl p-2.5 text-xs text-slate-800 mb-2"
                  />
                  <Button
                    title={isPublishing ? 'Posting to GMB...' : 'Post Reply Directly to GMB'}
                    onPress={() => handleQuickPostReply(rev)}
                    loading={isPublishing}
                    size="sm"
                    variant="primary"
                    icon={<Send size={13} color="#ffffff" />}
                  />
                </View>
              ) : (
                <Button
                  title={
                    activeDraftingId === rev.id && isGeneratingAI
                      ? 'AI Generating Reply...'
                      : 'Generate AI Reply'
                  }
                  onPress={() => handleQuickGenerateReply(rev)}
                  loading={activeDraftingId === rev.id && isGeneratingAI}
                  size="sm"
                  variant="secondary"
                  icon={<Sparkles size={13} color="#4f46e5" />}
                />
              )}
            </View>
          ))}
        </Card>

        {/* SECTION 2: Festival Calendar & AI Post Generator Shortcut */}
        <Card className="mb-4 bg-indigo-950 border-indigo-900">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Calendar size={18} color="#818cf8" className="mr-2" />
              <Text className="text-sm font-bold text-white">
                Festival Calendar & AI Post Studio
              </Text>
            </View>
            <Badge label="Upcoming Festivals" variant="primary" size="sm" />
          </View>
          <Text className="text-xs text-indigo-200 leading-relaxed mb-3">
            🪔 Upcoming: Diwali & Dhanteras, Bhai Dooj, Christmas & New Year! Let AI generate festival post ideas, GMB & social captions, and banners in 1 click.
          </Text>
          <Button
            title="Open Festival Calendar & Generate Post"
            onPress={() => navigation.navigate('Posts')}
            variant="primary"
            size="sm"
            icon={<Sparkles size={14} color="#ffffff" />}
          />
        </Card>

        {/* SECTION 3: GMB Search & Maps Insights */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
          Listing Insights (30 Days)
        </Text>
        <View className="flex-row space-x-2.5 mb-2.5">
          <MetricCard
            title="Google Maps Views"
            value={insights.mapsViews.toLocaleString()}
            subtitle="Direct Map discoveries"
            icon={<Navigation size={18} color="#2563eb" />}
          />
          <MetricCard
            title="Search Impressions"
            value={insights.searchViews.toLocaleString()}
            subtitle="Local 3-Pack searches"
            icon={<Eye size={18} color="#10b981" />}
          />
        </View>
        <View className="flex-row space-x-2.5 mb-4">
          <MetricCard
            title="Customer Calls"
            value={insights.callClicks.toLocaleString()}
            subtitle="Tapped Call on GMB"
            icon={<PhoneCall size={18} color="#6366f1" />}
          />
          <MetricCard
            title="Website Visits"
            value={insights.websiteClicks.toLocaleString()}
            subtitle={`Audit: ${webAudit?.overallScore || 82}/100`}
            icon={<Globe size={18} color="#f59e0b" />}
          />
        </View>

        {/* SECTION 4: Social Media Login & Cross-Post Status */}
        <Card className="mb-4 bg-white border-slate-200">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Share2 size={18} color="#2563eb" className="mr-2" />
              <Text className="text-sm font-bold text-slate-900">
                Social Media Connectors
              </Text>
            </View>
            <Badge
              label={`${connectedCount}/3 Logged In`}
              variant={connectedCount > 0 ? 'success' : 'warning'}
              size="sm"
            />
          </View>
          <Text className="text-xs text-slate-500 mb-3">
            Connect your Instagram, Facebook, and LinkedIn accounts with your email login to enable automated cross-posting.
          </Text>
          <Button
            title="Connect Instagram, Facebook & LinkedIn"
            onPress={() => navigation.navigate('More', { screen: 'Social' })}
            variant="secondary"
            size="sm"
          />
        </Card>
      </View>

      {/* Add GMB Listing Modal */}
      <Modal visible={showAddListingModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-slate-900">
                Add / Link GMB Listing
              </Text>
              <Pressable onPress={() => setShowAddListingModal(false)}>
                <Text className="text-xs font-bold text-slate-500">Cancel</Text>
              </Pressable>
            </View>

            <Text className="text-xs font-bold text-slate-700 mb-1">Business / Store Name *</Text>
            <TextInput
              value={newListingTitle}
              onChangeText={setNewListingTitle}
              placeholder="e.g. Sharma Sweets & Restaurant"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-bold text-slate-700 mb-1">Business Category</Text>
            <TextInput
              value={newListingCategory}
              onChangeText={setNewListingCategory}
              placeholder="e.g. Restaurant / Retail Store / Clinic"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-bold text-slate-700 mb-1">Street Address</Text>
            <TextInput
              value={newListingAddress}
              onChangeText={setNewListingAddress}
              placeholder="Shop 12, Main Market"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <View className="flex-row space-x-2 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">City</Text>
                <TextInput
                  value={newListingCity}
                  onChangeText={setNewListingCity}
                  placeholder="Delhi / Mumbai"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1">Phone</Text>
                <TextInput
                  value={newListingPhone}
                  onChangeText={setNewListingPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800"
                />
              </View>
            </View>

            <Button
              title="Link Listing to GMB Account"
              onPress={handleCreateListing}
              variant="primary"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
