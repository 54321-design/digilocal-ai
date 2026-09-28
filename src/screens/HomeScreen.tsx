import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native';
import {
  MapPin,
  Star,
  Sparkles,
  Share2,
  Calendar,
  CheckCircle,
  PhoneCall,
  Eye,
  Navigation,
  Globe,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Send,
  LogOut,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { useSocial } from '../context/SocialContext';
import { useSEO } from '../context/SEOContext';
import {
  MetricCard,
  Card,
  Badge,
  Button,
  LoadingState,
} from '../components';
import { GoogleReview } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signInWithGoogle, signOut, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    accounts,
    locations,
    selectedLocation,
    selectLocation,
    refreshGoogleData,
    isLoading: googleLoading,
    error: googleError,
  } = useGoogle();
  const {
    reviews,
    refreshReviews,
    sentimentReport,
    generateAIReply,
    publishReply,
    isGeneratingAI,
    isPublishing,
    error: reviewsError,
  } = useReviews();
  const { connectedCount } = useSocial();
  const { webAudit, runWebAudit } = useSEO();

  const [refreshing, setRefreshing] = useState(false);

  // Quick Dashboard AI Reply state
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [activeDraftingId, setActiveDraftingId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    runWebAudit();
    setRefreshing(false);
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

  const totalReviews = reviews.length;
  const unansweredReviews = reviews.filter((r) => !r.reviewReply?.comment);
  const unansweredCount = unansweredReviews.length;
  const averageRating =
    sentimentReport?.averageRating ||
    (totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.numericRating, 0) / totalReviews).toFixed(1)
      : '0.0');

  const insights = selectedLocation?.insights || {
    mapsViews: 0,
    searchViews: 0,
    callClicks: 0,
    websiteClicks: 0,
    directionRequests: 0,
  };

  // ============================================================================
  // STATE 1: NOT SIGNED IN -> MAIN GOOGLE SIGN-IN SCREEN
  // ============================================================================
  if (!isConnected) {
    return (
      <ScrollView
        className="flex-1 bg-slate-900"
        contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 48 }}
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
            Sign in with your Google Business Profile Gmail account to automatically fetch your real GMB accounts, storefront listings, customer reviews, and local insights.
          </Text>
        </View>

        <Card className="bg-slate-800 border-slate-700 p-5 mb-5">
          <Text className="text-sm font-bold text-white mb-3">
            Live Google Business Profile Features:
          </Text>

          {[
            'Auto-sync all GMB Accounts & Storefront Listings',
            'Real Customer Reviews with AI Positive / Average / Negative Sentiment',
            '1-Click AI Review Replies published directly to Google',
            'Festival Calendar with AI Post Captions & Banner Generator',
            'Instagram, Facebook & LinkedIn Account Login & Cross-Posting',
          ].map((item, idx) => (
            <View key={idx} className="flex-row items-center mb-2.5">
              <CheckCircle size={15} color="#34d399" />
              <Text className="text-xs text-slate-300 ml-2.5 flex-1">{item}</Text>
            </View>
          ))}

          <View className="mt-5">
            <Button
              title={authLoading ? 'Signing in with Google...' : 'Sign in with Google (GMB)'}
              onPress={signInWithGoogle}
              loading={authLoading}
              variant="primary"
              size="lg"
            />
          </View>
        </Card>
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
      {/* Connected Google Account Bar */}
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
                  {user?.displayName || 'Google Account'}
                </Text>
                <Badge label="Verified Google OAuth" variant="success" size="sm" />
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

        {/* All Connected Accounts & Listings from Google API */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            GMB Accounts ({accounts.length}) • Listings ({locations.length})
          </Text>
          <Pressable
            onPress={refreshGoogleData}
            className="flex-row items-center bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 rounded-lg"
          >
            <RefreshCw size={12} color="#60a5fa" />
            <Text className="text-[11px] font-bold text-blue-300 ml-1">Sync GMB</Text>
          </Pressable>
        </View>

        {googleLoading ? (
          <View className="py-3">
            <Text className="text-xs text-slate-300">
              Fetching your accounts & listings from Google Business Profile API...
            </Text>
          </View>
        ) : locations.length > 0 ? (
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
                  </View>
                  <Text
                    className={`text-[11px] ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                    numberOfLines={1}
                  >
                    {loc.categories?.primaryCategory?.displayName || 'GMB Listing'} •{' '}
                    {loc.storefrontAddress?.locality || ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      <View className="px-4 pt-4">
        {/* Show Real Google API Error / Status if any */}
        {googleError && (
          <Card className="mb-4 bg-rose-50 border-rose-200">
            <View className="flex-row items-start">
              <AlertCircle size={18} color="#e11d48" className="mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-rose-900 mb-1">
                  Google Business Profile API Response
                </Text>
                <Text className="text-xs text-rose-700 leading-relaxed mb-3">
                  {googleError}
                </Text>
                <Button
                  title="Retry Google GMB Sync"
                  onPress={refreshGoogleData}
                  size="sm"
                  variant="primary"
                />
              </View>
            </View>
          </Card>
        )}

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
                  {selectedLocation?.title || 'No Listing Selected'} ({totalReviews} Reviews)
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

          {reviewsError ? (
            <Text className="text-xs text-rose-600 mb-2">{reviewsError}</Text>
          ) : sentimentReport ? (
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
          ) : (
            <Text className="text-xs text-slate-500 mb-3">
              {selectedLocation
                ? 'No customer reviews found on this listing yet.'
                : 'Connect an active GMB listing to analyze reviews.'}
            </Text>
          )}

          {/* Direct Dashboard AI Review Replies */}
          {unansweredReviews.length > 0 && (
            <>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-slate-800">
                  Unanswered Reviews ({unansweredCount})
                </Text>
                <Pressable onPress={() => navigation.navigate('Reviews')}>
                  <Text className="text-xs font-bold text-blue-600">View All →</Text>
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
            </>
          )}
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

        {/* SECTION 3: Real GMB Search & Maps Insights */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
          Real Listing Insights (30 Days)
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
            subtitle={webAudit ? `Audit: ${webAudit.overallScore}/100` : 'Run Web Audit'}
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
    </ScrollView>
  );
};
