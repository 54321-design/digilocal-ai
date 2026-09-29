import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  MapPin,
  Star,
  Clock,
  ChevronRight,
  CheckCircle,
  PhoneCall,
  Eye,
  Navigation,
  Globe,
  LogOut,
  AlertCircle,
  RefreshCw,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Building2,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { useSocial } from '../context/SocialContext';
import { useSEO } from '../context/SEOContext';
import { usePosts } from '../context/PostsContext';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signInWithGoogle, signOut, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    locations,
    selectedLocation,
    selectLocation,
    refreshGoogleData,
    isLoading: googleLoading,
    isSyncingLocation,
    error: googleError,
  } = useGoogle();
  const {
    reviews,
    isLoading: reviewsLoading,
    refreshReviews,
    sentimentReport,
  } = useReviews();
  const { connectedCount } = useSocial();
  const { audit, webAudit, isLoadingWebAudit, runWebAudit } = useSEO();
  const { filteredPosts } = usePosts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    if (selectedLocation?.websiteUri) {
      await runWebAudit(selectedLocation.websiteUri);
    }
    setRefreshing(false);
  };

  const totalReviews = reviews.length;
  const unansweredReviews = reviews.filter((r) => !r.reviewReply?.comment);
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

  const totalInteractions =
    insights.mapsViews +
    insights.searchViews +
    insights.callClicks +
    insights.websiteClicks +
    insights.directionRequests;

  const formattedAddress = selectedLocation?.storefrontAddress
    ? [
        ...(selectedLocation.storefrontAddress.addressLines || []),
        selectedLocation.storefrontAddress.locality,
        selectedLocation.storefrontAddress.administrativeArea,
        selectedLocation.storefrontAddress.postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const primaryCategory =
    selectedLocation?.categories?.primaryCategory?.displayName || 'Uncategorized Listing';
  const primaryPhone = selectedLocation?.phoneNumbers?.primaryPhone || '';
  const websiteUri = selectedLocation?.websiteUri || '';
  const hoursCount = selectedLocation?.regularHours?.periods?.length || 0;

  // ============================================================================
  // STATE 1: NOT SIGNED IN -> CLEAN, LIGHT GOOGLE SIGN-IN SCREEN
  // ============================================================================
  if (!isConnected) {
    return (
      <ScrollView
        style={{ backgroundColor: '#F3F5F9' }}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 32, paddingBottom: 48 }}
      >
        <View className="bg-white rounded-3xl p-6 border border-slate-100">
          <View
            style={{ backgroundColor: '#EEF2FF' }}
            className="w-14 h-14 rounded-2xl items-center justify-center mb-4"
          >
            <MapPin size={26} color="#131A38" />
          </View>

          <Text style={{ color: '#131A38' }} className="text-2xl font-bold mb-2">
            Connect your Google Business Profile
          </Text>
          <Text className="text-slate-500 text-sm leading-relaxed mb-6">
            Sign in with your business Gmail account to manage your live Google Business Profile
            locations, view 30-day Maps & Search performance, reply to customer reviews, and run
            live SEO audits.
          </Text>

          <View className="mb-6">
            {[
              'Sync all Google Business accounts and storefront locations',
              'View live 30-day Google Search, Maps, Calls & Website metrics per location',
              'Real-time customer review sentiment analysis and direct Google replies',
              'Live GMB completeness audit and HTTP website SEO inspection',
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-3">
                <CheckCircle size={17} color="#1E8E3E" />
                <Text className="text-slate-700 text-[13px] ml-3 flex-1">{item}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={signInWithGoogle}
            disabled={authLoading}
            style={{ backgroundColor: '#131A38' }}
            className="py-4 rounded-2xl items-center justify-center"
          >
            <Text className="text-white font-semibold text-[15px]">
              {authLoading ? 'Connecting Google Account...' : 'Continue with Google'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ============================================================================
  // STATE 2: SIGNED IN -> DEDICATED GMB LOCATION DASHBOARD (100% REAL DATA)
  // ============================================================================
  return (
    <ScrollView
      style={{ backgroundColor: '#F3F5F9' }}
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* ==================================================================== */}
      {/* 1. ACTIVE GOOGLE ACCOUNT & LOCATION SWITCHER BAR                     */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-slate-100 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-xs text-slate-400 font-medium">Connected Google Account</Text>
            <Text className="text-sm font-semibold text-slate-800 mt-0.5" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={onRefresh}
              disabled={googleLoading || isSyncingLocation}
              className="flex-row items-center px-3 py-1.5 rounded-full bg-slate-100"
            >
              <RefreshCw size={12} color="#475569" />
              <Text className="text-xs font-medium text-slate-700 ml-1.5">
                {googleLoading || isSyncingLocation ? 'Syncing...' : 'Sync'}
              </Text>
            </Pressable>
            <Pressable onPress={signOut} className="p-2 rounded-full bg-slate-100">
              <LogOut size={14} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Location Selector Pills */}
        {googleLoading && locations.length === 0 ? (
          <View className="flex-row items-center mt-3 py-2">
            <ActivityIndicator size="small" color="#131A38" />
            <Text className="text-xs text-slate-500 ml-2">
              Loading your Google Business Profile locations...
            </Text>
          </View>
        ) : locations.length > 0 ? (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Select Business Location ({locations.length})
              </Text>
              {isSyncingLocation || reviewsLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-[11px] font-medium text-blue-600 ml-1.5">
                    Fetching live data...
                  </Text>
                </View>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {locations.map((loc) => {
                const active = selectedLocation?.id === loc.id;
                const city = loc.storefrontAddress?.locality;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => selectLocation(loc.id)}
                    style={{
                      backgroundColor: active ? '#131A38' : '#F8FAFC',
                      borderColor: active ? '#131A38' : '#E2E8F0',
                      borderWidth: 1,
                    }}
                    className="mr-2.5 px-3.5 py-2.5 rounded-xl flex-row items-center"
                  >
                    <MapPin size={13} color={active ? '#FFFFFF' : '#475569'} />
                    <View className="ml-1.5">
                      <Text
                        style={{ color: active ? '#FFFFFF' : '#1E293B' }}
                        className="text-xs font-semibold"
                        numberOfLines={1}
                      >
                        {loc.title}
                      </Text>
                      {city ? (
                        <Text
                          style={{ color: active ? '#CBD5E1' : '#64748B' }}
                          className="text-[10px]"
                          numberOfLines={1}
                        >
                          {city}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {googleError ? (
          <View className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertCircle size={15} color="#E11D48" />
              <Text className="text-xs text-rose-700 ml-2 flex-1" numberOfLines={2}>
                {googleError}
              </Text>
            </View>
            <Pressable
              onPress={refreshGoogleData}
              className="px-2.5 py-1 rounded-lg bg-white border border-rose-200"
            >
              <Text className="text-xs font-medium text-rose-700">Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ==================================================================== */}
      {/* 2. SELECTED GMB LOCATION STOREFRONT DETAILS CARD                     */}
      {/* ==================================================================== */}
      {selectedLocation ? (
        <View className="bg-white px-5 pt-5 pb-5 mb-3">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1.5">
                <View
                  style={{ backgroundColor: '#EEF2FF' }}
                  className="px-2.5 py-0.5 rounded-full mr-2"
                >
                  <Text style={{ color: '#1E40AF' }} className="text-[11px] font-semibold">
                    {primaryCategory}
                  </Text>
                </View>
                <View
                  style={{ backgroundColor: '#ECFDF3' }}
                  className="px-2.5 py-0.5 rounded-full flex-row items-center"
                >
                  <CheckCircle size={11} color="#166534" />
                  <Text style={{ color: '#166534' }} className="text-[11px] font-semibold ml-1">
                    Live GMB Listing
                  </Text>
                </View>
              </View>

              <Text style={{ color: '#131A38' }} className="text-[20px] font-bold">
                {selectedLocation.title}
              </Text>
            </View>

            <Pressable
              onPress={() => selectLocation(selectedLocation.id)}
              disabled={isSyncingLocation}
              style={{ borderColor: '#E2E8F0', borderWidth: 1 }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 flex-row items-center"
            >
              <RefreshCw size={12} color="#334155" />
              <Text className="text-xs font-medium text-slate-700 ml-1.5">
                {isSyncingLocation ? 'Updating' : 'Refresh'}
              </Text>
            </Pressable>
          </View>

          {/* Storefront Metadata Rows */}
          <View
            style={{ backgroundColor: '#F8FAFC', borderColor: '#EEF1F6', borderWidth: 1 }}
            className="rounded-2xl p-3.5 gap-2.5"
          >
            {/* Address */}
            <View className="flex-row items-start">
              <MapPin size={15} color="#475569" style={{ marginTop: 2 }} />
              <Text className="text-xs text-slate-700 ml-2.5 flex-1 leading-relaxed">
                {formattedAddress || 'No storefront street address configured on this Google listing'}
              </Text>
            </View>

            {/* Phone */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <PhoneCall size={15} color="#475569" />
                <Text className="text-xs text-slate-700 ml-2.5">
                  {primaryPhone || 'No primary phone number listed'}
                </Text>
              </View>
              {primaryPhone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${primaryPhone}`).catch(() => {})}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200"
                >
                  <Text className="text-[11px] font-semibold text-slate-700">Call</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Website */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Globe size={15} color="#475569" />
                <Text className="text-xs text-slate-700 ml-2.5 flex-1" numberOfLines={1}>
                  {websiteUri || 'No website URL linked to this location'}
                </Text>
              </View>
              {websiteUri ? (
                <Pressable
                  onPress={() =>
                    WebBrowser.openBrowserAsync(
                      websiteUri.startsWith('http') ? websiteUri : `https://${websiteUri}`
                    ).catch(() => {})
                  }
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 flex-row items-center"
                >
                  <ExternalLink size={11} color="#334155" />
                  <Text className="text-[11px] font-semibold text-slate-700 ml-1">Open</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Operating Hours */}
            <View className="flex-row items-center">
              <Clock size={15} color="#475569" />
              <Text className="text-xs text-slate-700 ml-2.5">
                {hoursCount > 0
                  ? `Regular operating hours configured (${hoursCount} day periods)`
                  : 'Operating hours not configured on Google Business Profile'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-white px-5 py-6 mb-3 items-center">
          <Building2 size={28} color="#94A3B8" />
          <Text className="text-sm font-semibold text-slate-800 mt-2">
            No Google Business Location Selected
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-1">
            Tap Sync above to fetch your verified locations from Google Business Profile.
          </Text>
        </View>
      )}

      {/* ==================================================================== */}
      {/* 3. LIVE 30-DAY GOOGLE BUSINESS PROFILE PERFORMANCE INSIGHTS          */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-6 pb-6 mb-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text style={{ color: '#4A4E58' }} className="text-[20px] font-bold">
            Profile Performance (30 Days)
          </Text>
          <View
            style={{ backgroundColor: '#EFF6FF' }}
            className="px-3 py-1 rounded-full"
          >
            <Text style={{ color: '#1E40AF' }} className="text-xs font-bold">
              {totalInteractions.toLocaleString()} total interactions
            </Text>
          </View>
        </View>
        <Text className="text-xs text-slate-500 mb-4">
          Live Google Business Profile Performance API metrics for{' '}
          {selectedLocation?.title || 'selected location'}
        </Text>

        <View className="flex-row gap-3 mb-3">
          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-4 rounded-2xl"
          >
            <Eye size={18} color="#1E8E3E" />
            <Text className="text-2xl font-bold text-slate-900 mt-2">
              {insights.searchViews.toLocaleString()}
            </Text>
            <Text className="text-xs font-medium text-slate-600 mt-0.5">Google Search Views</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">Desktop & Mobile Search</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-4 rounded-2xl"
          >
            <Navigation size={18} color="#2563EB" />
            <Text className="text-2xl font-bold text-slate-900 mt-2">
              {insights.mapsViews.toLocaleString()}
            </Text>
            <Text className="text-xs font-medium text-slate-600 mt-0.5">Google Maps Views</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">Desktop & Mobile Maps</Text>
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3.5 rounded-2xl"
          >
            <PhoneCall size={16} color="#9333EA" />
            <Text className="text-lg font-bold text-slate-900 mt-1.5">
              {insights.callClicks.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Call Clicks</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3.5 rounded-2xl"
          >
            <Globe size={16} color="#EA580C" />
            <Text className="text-lg font-bold text-slate-900 mt-1.5">
              {insights.websiteClicks.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Website Clicks</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3.5 rounded-2xl"
          >
            <MapPin size={16} color="#0284C7" />
            <Text className="text-lg font-bold text-slate-900 mt-1.5">
              {insights.directionRequests.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Directions</Text>
          </View>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 4. YOUR WEBSITE & GMB PROFILE AUDIT CARD                             */}
      {/* ==================================================================== */}
      <View className="bg-white px-5 pt-6 pb-6 mb-3">
        <View className="flex-row items-center justify-between mb-4">
          <Text style={{ color: '#4A4E58' }} className="text-[20px] font-bold">
            Your Website & GMB Health
          </Text>
          {audit ? (
            <View
              style={{
                backgroundColor: audit.passedCount >= 5 ? '#ECFDF3' : '#FEF9E7',
              }}
              className="px-3 py-1 rounded-full"
            >
              <Text
                style={{
                  color: audit.passedCount >= 5 ? '#166534' : '#785A08',
                }}
                className="text-xs font-bold"
              >
                GMB Profile: {audit.passedCount}/{audit.totalChecks} Checks
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: '#FAF5FF',
            borderColor: '#D8B4FE',
            borderWidth: 1.2,
          }}
          className="rounded-2xl p-4"
        >
          <View className="flex-row items-start mb-4">
            {/* Clean Browser Wireframe Illustration */}
            <View
              style={{ borderColor: '#E9D5FF', borderWidth: 1 }}
              className="w-24 bg-white rounded-2xl p-3 mr-4"
            >
              <View className="flex-row gap-1.5 mb-2">
                <View style={{ backgroundColor: '#DBEAFE' }} className="w-2 h-2 rounded-full" />
                <View style={{ backgroundColor: '#DBEAFE' }} className="w-2 h-2 rounded-full" />
                <View style={{ backgroundColor: '#DBEAFE' }} className="w-2 h-2 rounded-full" />
              </View>
              <View
                style={{ backgroundColor: '#C7D2FE' }}
                className="w-full h-12 rounded-lg mb-2"
              />
              <View
                style={{ backgroundColor: '#E2E8F0' }}
                className="w-4/5 h-2 rounded-full mb-1.5"
              />
              <View
                style={{ backgroundColor: '#E2E8F0' }}
                className="w-3/5 h-2 rounded-full"
              />
            </View>

            {/* Right Content */}
            <View className="flex-1">
              <View
                style={{ borderColor: '#E9D5FF', borderWidth: 1 }}
                className="bg-white self-start px-3 py-1 rounded-full flex-row items-center mb-2"
              >
                <ShieldCheck size={12} color="#9333EA" />
                <Text style={{ color: '#9333EA' }} className="text-xs font-semibold ml-1.5">
                  {isLoadingWebAudit
                    ? 'Auditing Live URL...'
                    : webAudit
                    ? `Live Website Score: ${webAudit.overallScore}/100`
                    : websiteUri
                    ? 'Website Linked'
                    : 'No Website Linked'}
                </Text>
              </View>

              <Text className="text-slate-900 font-bold text-[16px] mb-1">
                {websiteUri ? websiteUri : 'Add a website to this Google listing'}
              </Text>
              <Text className="text-slate-600 text-xs leading-relaxed">
                {webAudit
                  ? `Inspected ${webAudit.checks.length} live HTTP & HTML SEO signals (${webAudit.responseTimeMs}ms response).`
                  : websiteUri
                  ? 'Run a live HTTP & HTML SEO audit on your linked business website.'
                  : 'Linking a website to your Google Business Profile improves local search ranking.'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Audit')}
            style={{ backgroundColor: '#131A38' }}
            className="py-3.5 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-white font-semibold text-xs mr-1.5">
              Open Full GMB & Website Audit
            </Text>
            <ChevronRight size={15} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 5. QUICK NAVIGATION CARDS TO REVIEWS & SOCIAL CALENDAR TABS          */}
      {/* ==================================================================== */}
      <View className="px-5 gap-3">
        {/* Customer Reviews Summary Card */}
        <Pressable
          onPress={() => navigation.navigate('Reviews')}
          className="bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{ backgroundColor: '#FEF9E7' }}
              className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5"
            >
              <MessageSquare size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-slate-900 font-bold text-[16px] mr-2">
                  Google Customer Reviews
                </Text>
                <View
                  style={{ backgroundColor: '#FEF9E7' }}
                  className="px-2 py-0.5 rounded-full flex-row items-center"
                >
                  <Star size={11} color="#F4B400" fill="#F4B400" />
                  <Text style={{ color: '#785A08' }} className="text-[11px] font-bold ml-1">
                    {averageRating}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-slate-500 mt-1">
                {reviewsLoading
                  ? 'Loading reviews for this location...'
                  : `${totalReviews} verified reviews · ${unansweredReviews.length} awaiting reply`}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>

        {/* Social Calendar & AI Post Summary Card */}
        <Pressable
          onPress={() => navigation.navigate('Posts')}
          className="bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{ backgroundColor: '#EEF2FF' }}
              className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5"
            >
              <Calendar size={22} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-[16px]">
                Social Calendar & AI Posters
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                {filteredPosts.length} posts for this location · {connectedCount} of 3 social
                channels connected
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#64748B" />
        </Pressable>
      </View>
    </ScrollView>
  );
};
