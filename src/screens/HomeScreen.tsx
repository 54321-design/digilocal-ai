import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
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
  AlertCircle,
  Calendar,
  MessageSquare,
  Share2,
  TrendingUp,
  ExternalLink,
  Layers,
  ShieldAlert,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
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
  const { signInWithGoogle, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    locations,
    selectedLocation,
    isAllLocationsSelected,
    activeInsights,
    refreshGoogleData,
    error: googleError,
  } = useGoogle();
  const { reviews, refreshReviews, sentimentReport, totalReviewCount } = useReviews();
  const { connectedCount } = useSocial();
  const { audit, runWebAudit } = useSEO();
  const { locationPosts } = usePosts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    if (selectedLocation?.websiteUri) {
      await runWebAudit(selectedLocation.websiteUri);
    }
    setRefreshing(false);
  };

  // Real Review & Rating Metrics (100% grounded in Google Business Profile API)
  const totalReviews = Math.max(totalReviewCount || 0, reviews.length);
  const unansweredReviews = useMemo(
    () => reviews.filter((r) => !r.reviewReply?.comment),
    [reviews]
  );
  const negativeUnansweredReviews = useMemo(
    () => unansweredReviews.filter((r) => r.numericRating <= 2),
    [unansweredReviews]
  );

  const averageRatingNum = useMemo(() => {
    if (sentimentReport?.averageRating) return Number(sentimentReport.averageRating);
    if (reviews.length === 0) return 0;
    return Number(
      (reviews.reduce((acc, r) => acc + r.numericRating, 0) / reviews.length).toFixed(1)
    );
  }, [sentimentReport, reviews]);

  // Real month-over-month review stats from actual createTime timestamps
  const { newThisMonthCount, ratingDeltaLabel } = useMemo(() => {
    if (reviews.length === 0) {
      return { newThisMonthCount: 0, ratingDeltaLabel: 'No reviews yet' };
    }
    const now = new Date();
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const recent = reviews.filter((r) => {
      const t = new Date(r.createTime || 0).getTime();
      return t >= thirtyDaysAgo;
    });
    const older = reviews.filter((r) => {
      const t = new Date(r.createTime || 0).getTime();
      return t > 0 && t < thirtyDaysAgo;
    });

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((s, r) => s + r.numericRating, 0) / recent.length;
      const olderAvg = older.reduce((s, r) => s + r.numericRating, 0) / older.length;
      const diff = Number((recentAvg - olderAvg).toFixed(1));
      const sign = diff >= 0 ? '+' : '';
      return {
        newThisMonthCount: recent.length,
        ratingDeltaLabel: `${sign}${diff} this month`,
      };
    }

    return {
      newThisMonthCount: recent.length,
      ratingDeltaLabel: `${recent.length} in last 30d`,
    };
  }, [reviews]);

  // Real 6-Month Rating Trend computed from actual reviews (month-wise progression)
  const monthlyRatingTrend = useMemo(() => {
    if (reviews.length === 0) return [];
    const now = new Date();
    const shortMonths = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const sortedAsc = [...reviews].sort(
      (a, b) => new Date(a.createTime || 0).getTime() - new Date(b.createTime || 0).getTime()
    );

    const overallAvg = Number(
      (sortedAsc.reduce((s, r) => s + r.numericRating, 0) / sortedAsc.length).toFixed(1)
    );

    // Build 6 monthly buckets from 5 months ago up to the current month
    return [5, 4, 3, 2, 1, 0].map((monthsAgo) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - monthsAgo + 1,
        0,
        23,
        59,
        59,
        999
      );
      const startMs = monthStart.getTime();
      const endMs = monthEnd.getTime();

      const inMonth = sortedAsc.filter((r) => {
        const t = new Date(r.createTime || 0).getTime();
        return t >= startMs && t <= endMs;
      });

      const upToMonth = sortedAsc.filter((r) => {
        const t = new Date(r.createTime || 0).getTime();
        return t > 0 && t <= endMs;
      });

      let rating = overallAvg;
      if (inMonth.length > 0) {
        rating = Number(
          (inMonth.reduce((s, r) => s + r.numericRating, 0) / inMonth.length).toFixed(1)
        );
      } else if (upToMonth.length > 0) {
        rating = Number(
          (upToMonth.reduce((s, r) => s + r.numericRating, 0) / upToMonth.length).toFixed(1)
        );
      }

      return {
        label: shortMonths[monthStart.getMonth()],
        year: monthStart.getFullYear(),
        rating,
        monthCount: inMonth.length,
        cumulativeCount: upToMonth.length,
      };
    });
  }, [reviews]);

  // Real Post stats for active location (or all locations)
  const scheduledPostsCount = locationPosts.filter((p) => p.status === 'scheduled').length;
  const draftPostsCount = locationPosts.filter((p) => p.status === 'draft').length;
  const publishedPostsCount = locationPosts.filter((p) => p.status === 'published').length;

  const totalInteractions =
    activeInsights.searchViews +
    activeInsights.mapsViews +
    activeInsights.callClicks +
    activeInsights.websiteClicks +
    activeInsights.directionRequests;

  // ============================================================================
  // STATE 1: NOT SIGNED IN -> CLEAN LOGIN WITH DIGIBIRDS 360° LOGO
  // ============================================================================
  if (!isConnected) {
    return (
      <ScrollView
        style={{ backgroundColor: '#F3F5F9' }}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 48 }}
      >
        <View className="bg-white rounded-3xl p-6 border border-slate-100">
          <View className="items-center mb-6 pt-2">
            <Image
              source={require('../../assets/digibirds-logo.png')}
              style={{ width: 210, height: 68 }}
              resizeMode="contain"
            />
          </View>

          <Text style={{ color: '#131A38' }} className="text-xl font-bold text-center mb-2">
            Connect your Google Business Profile
          </Text>
          <Text className="text-slate-500 text-sm text-center leading-relaxed mb-6">
            Sign in with your business Gmail account to monitor your rating, respond to reviews,
            schedule social posts, and track Google Maps performance.
          </Text>

          <View className="mb-6">
            {[
              'Multi-location selector with aggregated business insights',
              'Morning Needs Attention alerts for reviews & integrations',
              'AI Review Responder with direct Google Business Profile reply',
              'Social Calendar, Drafts, and Live Domain & Website SEO Audit',
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-start mb-3">
                <CheckCircle size={17} color="#1E8E3E" style={{ marginTop: 1 }} />
                <Text className="text-slate-700 text-[13px] leading-snug ml-3 flex-1">
                  {item}
                </Text>
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
  // STATE 2: SIGNED IN -> CLEAN EXECUTIVE BUSINESS OWNER DASHBOARD
  // ============================================================================
  return (
    <ScrollView
      style={{ backgroundColor: '#F3F5F9' }}
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Google API Error Banner if any */}
      {googleError ? (
        <View className="mx-4 mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <AlertCircle size={16} color="#E11D48" />
            <Text className="text-xs text-rose-700 ml-2 flex-1 leading-snug">
              {googleError}
            </Text>
          </View>
          <Pressable
            onPress={refreshGoogleData}
            className="px-3 py-1.5 rounded-lg bg-white border border-rose-200"
          >
            <Text className="text-xs font-semibold text-rose-700">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ==================================================================== */}
      {/* 1. HORIZONTAL SCROLLABLE KPI SUMMARY CARDS (100% REAL DATA)          */}
      {/* ==================================================================== */}
      <View className="pt-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {/* Card 1: Rating */}
          <Pressable
            onPress={() => navigation.navigate('Reviews')}
            style={{ width: 158, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <Star size={16} color="#F4B400" fill="#F4B400" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Rating</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1.5">
              {totalReviews > 0 ? averageRatingNum.toFixed(1) : '—'}
            </Text>
            <Text className="text-xs font-medium text-emerald-700" numberOfLines={1}>
              {ratingDeltaLabel}
            </Text>
          </Pressable>

          {/* Card 2: Reviews */}
          <Pressable
            onPress={() => navigation.navigate('Reviews')}
            style={{ width: 158, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <MessageSquare size={16} color="#2563EB" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Reviews</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1.5">
              {totalReviews}
            </Text>
            <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
              {reviews.length < totalReviews
                ? `Loaded ${reviews.length} of ${totalReviews}`
                : newThisMonthCount > 0
                ? `${newThisMonthCount} new (30d)`
                : `${unansweredReviews.length} unanswered`}
            </Text>
          </Pressable>

          {/* Card 3: Posts */}
          <Pressable
            onPress={() => navigation.navigate('Posts')}
            style={{ width: 158, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <Calendar size={16} color="#9333EA" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Social Posts</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1.5">
              {scheduledPostsCount}
            </Text>
            <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
              {draftPostsCount} drafts · {publishedPostsCount} posted
            </Text>
          </Pressable>

          {/* Card 4: Channels */}
          <Pressable
            onPress={() => navigation.navigate('Posts')}
            style={{ width: 158, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <Share2 size={16} color="#0D9488" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Integrations</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1.5">
              {connectedCount + 1}/4
            </Text>
            <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
              GMB + {connectedCount}/3 social
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ==================================================================== */}
      {/* 2. "NEEDS ATTENTION" SECTION (MORNING ACTIONABLE PRIORITIES)         */}
      {/* ==================================================================== */}
      <View className="bg-white mx-4 mt-2 rounded-2xl p-5 border border-slate-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <ShieldAlert size={18} color="#DC2626" />
            <Text style={{ color: '#131A38' }} className="text-base font-bold ml-2">
              Needs Attention
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-400">
            {isAllLocationsSelected
              ? 'All Locations'
              : selectedLocation?.storefrontAddress?.locality || 'Active Listing'}
          </Text>
        </View>

        {/* Alert 1: Unanswered / Negative Reviews */}
        {unansweredReviews.length > 0 ? (
          <View
            style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }}
            className="rounded-2xl p-4 mb-3"
          >
            <Text style={{ color: '#991B1B' }} className="text-sm font-bold">
              {negativeUnansweredReviews.length > 0
                ? `${negativeUnansweredReviews.length} negative ${
                    negativeUnansweredReviews.length === 1 ? 'review' : 'reviews'
                  }`
                : `${unansweredReviews.length} unanswered ${
                    unansweredReviews.length === 1 ? 'review' : 'reviews'
                  }`}
            </Text>
            <Text className="text-xs text-slate-700 mt-1 leading-relaxed">
              You have {unansweredReviews.length}{' '}
              {unansweredReviews.length === 1 ? 'review' : 'reviews'} waiting for a response.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Reviews')}
              style={{ backgroundColor: '#131A38' }}
              className="self-start mt-3 px-4 py-2 rounded-xl flex-row items-center"
            >
              <Text className="text-xs font-semibold text-white">View Reviews</Text>
              <ChevronRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        ) : null}

        {/* Alert 2: Disconnected Social Integrations */}
        {connectedCount < 3 ? (
          <View
            style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1 }}
            className="rounded-2xl p-4 mb-3"
          >
            <Text style={{ color: '#92400E' }} className="text-sm font-bold">
              {3 - connectedCount} social {3 - connectedCount === 1 ? 'channel' : 'channels'} not
              connected
            </Text>
            <Text className="text-xs text-slate-700 mt-1 leading-relaxed">
              Connect Facebook, Instagram, and LinkedIn to publish updates across all channels.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Posts')}
              style={{ backgroundColor: '#131A38' }}
              className="self-start mt-3 px-4 py-2 rounded-xl flex-row items-center"
            >
              <Text className="text-xs font-semibold text-white">Connect Channels</Text>
              <ChevronRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        ) : null}

        {/* Alert 3: GMB Completeness / Missing Website */}
        {!isAllLocationsSelected && audit && audit.passedCount < audit.totalChecks ? (
          <View
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1 }}
            className="rounded-2xl p-4"
          >
            <Text style={{ color: '#1E40AF' }} className="text-sm font-bold">
              {audit.totalChecks - audit.passedCount} GMB profile{' '}
              {audit.totalChecks - audit.passedCount === 1 ? 'check' : 'checks'} need attention
            </Text>
            <Text className="text-xs text-slate-700 mt-1 leading-relaxed">
              { audit.passedCount } of { audit.totalChecks } profile completeness checks passed for{' '}
              {selectedLocation?.title}.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Audit')}
              style={{ backgroundColor: '#131A38' }}
              className="self-start mt-3 px-4 py-2 rounded-xl flex-row items-center"
            >
              <Text className="text-xs font-semibold text-white">Open SEO Audit</Text>
              <ChevronRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        ) : null}

        {unansweredReviews.length === 0 &&
          connectedCount === 3 &&
          (!audit || audit.passedCount === audit.totalChecks) && (
            <View
              style={{ backgroundColor: '#ECFDF3', borderColor: '#BBF7D0', borderWidth: 1 }}
              className="rounded-2xl p-4 flex-row items-center"
            >
              <CheckCircle size={18} color="#166534" />
              <Text style={{ color: '#166534' }} className="text-xs font-semibold ml-2.5 flex-1">
                Everything is up to date! All reviews are answered and channels are active.
              </Text>
            </View>
          )}
      </View>

      {/* ==================================================================== */}
      {/* 3. MONTH-WISE RATING TREND (SMOOTH CURVED LINE GRAPH)                */}
      {/* ==================================================================== */}
      <View className="bg-white mx-4 mt-3 rounded-2xl p-5 border border-slate-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text style={{ color: '#131A38' }} className="text-base font-bold">
              Rating Trend (Month-Wise)
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              6-month customer rating curve from verified Google reviews
            </Text>
          </View>
          <View
            style={{ backgroundColor: '#FEF9E7' }}
            className="px-3 py-1 rounded-full flex-row items-center"
          >
            <Star size={13} color="#F4B400" fill="#F4B400" />
            <Text style={{ color: '#785A08' }} className="text-xs font-bold ml-1">
              {totalReviews > 0 ? `${averageRatingNum.toFixed(1)} / 5.0` : 'No data'}
            </Text>
          </View>
        </View>

        {monthlyRatingTrend.length > 0 ? (
          <View
            style={{ backgroundColor: '#F8FAFC', borderColor: '#EEF1F6', borderWidth: 1 }}
            className="rounded-2xl pt-3 pb-2 px-2"
          >
            {(() => {
              const svgW = 320;
              const svgH = 182;
              const padL = 36;
              const padR = 18;
              const padT = 26;
              const padB = 32;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const minDataRating = Math.min(...monthlyRatingTrend.map((m) => m.rating));
              const yMin = Math.min(3.5, Math.max(1.0, Math.floor((minDataRating - 0.5) * 2) / 2));
              const yMax = 5.0;
              const yRange = Math.max(0.5, yMax - yMin);

              const yTicks = [
                yMax,
                Number((yMax - yRange / 3).toFixed(1)),
                Number((yMax - (2 * yRange) / 3).toFixed(1)),
                yMin,
              ];

              const coords = monthlyRatingTrend.map((pt, i) => {
                const x =
                  monthlyRatingTrend.length > 1
                    ? padL + (i / (monthlyRatingTrend.length - 1)) * plotW
                    : padL + plotW / 2;
                const clamped = Math.max(yMin, Math.min(yMax, pt.rating));
                const y = padT + plotH - ((clamped - yMin) / yRange) * plotH;
                return { ...pt, x, y };
              });

              // Build smooth cubic bezier curve path
              let linePath = '';
              coords.forEach((pt, idx) => {
                if (idx === 0) {
                  linePath = `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
                } else {
                  const prev = coords[idx - 1];
                  const dx = (pt.x - prev.x) * 0.45;
                  const cp1x = (prev.x + dx).toFixed(1);
                  const cp1y = prev.y.toFixed(1);
                  const cp2x = (pt.x - dx).toFixed(1);
                  const cp2y = pt.y.toFixed(1);
                  linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
                }
              });

              const firstPt = coords[0];
              const lastPt = coords[coords.length - 1];
              const baselineY = (padT + plotH).toFixed(1);
              const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${baselineY} L ${firstPt.x.toFixed(1)} ${baselineY} Z`;

              return (
                <Svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                  <Defs>
                    <LinearGradient id="ratingCurveGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                      <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                    </LinearGradient>
                  </Defs>

                  {/* Horizontal Grid Lines & Y-Axis Labels */}
                  {yTicks.map((tickVal, idx) => {
                    const yPos = padT + plotH - ((tickVal - yMin) / yRange) * plotH;
                    return (
                      <React.Fragment key={`tick-${idx}`}>
                        <Line
                          x1={padL}
                          y1={yPos}
                          x2={svgW - padR}
                          y2={yPos}
                          stroke="#E2E8F0"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                        <SvgText
                          x={padL - 8}
                          y={yPos + 4}
                          fontSize="10"
                          fontWeight="600"
                          fill="#64748B"
                          textAnchor="end"
                        >
                          {tickVal.toFixed(1)}★
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Gradient Area under Smooth Curve */}
                  <Path d={areaPath} fill="url(#ratingCurveGrad)" />

                  {/* Smooth Cubic Bezier Curve Line */}
                  <Path
                    d={linePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Point Dots, Rating Values & Month Labels */}
                  {coords.map((pt, idx) => {
                    const isLatest = idx === coords.length - 1;
                    return (
                      <React.Fragment key={`pt-${pt.label}-${idx}`}>
                        {isLatest && (
                          <Circle
                            cx={pt.x}
                            cy={pt.y}
                            r="8"
                            fill="#2563EB"
                            fillOpacity="0.18"
                          />
                        )}
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isLatest ? '5' : '4'}
                          fill={isLatest ? '#131A38' : '#2563EB'}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        {/* Rating label above point */}
                        <SvgText
                          x={pt.x}
                          y={pt.y - 10}
                          fontSize="10"
                          fontWeight="700"
                          fill={isLatest ? '#131A38' : '#334155'}
                          textAnchor="middle"
                        >
                          {pt.rating.toFixed(1)}
                        </SvgText>
                        {/* Month label on X-axis */}
                        <SvgText
                          x={pt.x}
                          y={padT + plotH + 20}
                          fontSize="11"
                          fontWeight={isLatest ? '700' : '600'}
                          fill={isLatest ? '#131A38' : '#64748B'}
                          textAnchor="middle"
                        >
                          {pt.label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>
              );
            })()}
          </View>
        ) : (
          <View className="py-6 items-center bg-slate-50 rounded-2xl border border-slate-100">
            <TrendingUp size={22} color="#94A3B8" />
            <Text className="text-xs font-medium text-slate-500 mt-2">
              No Google reviews recorded yet for this location.
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================================== */}
      {/* 4. 30-DAY BUSINESS PERFORMANCE (SINGLE OR AGGREGATED ALL LOCATIONS)  */}
      {/* ==================================================================== */}
      <View className="bg-white mx-4 mt-3 rounded-2xl p-5 border border-slate-100">
        <View className="flex-row items-center justify-between mb-1">
          <Text style={{ color: '#131A38' }} className="text-base font-bold flex-1 mr-2">
            Business Performance (30 Days)
          </Text>
          <View style={{ backgroundColor: '#EFF6FF' }} className="px-2.5 py-1 rounded-full">
            <Text style={{ color: '#1E40AF' }} className="text-[11px] font-bold">
              {totalInteractions.toLocaleString()} interactions
            </Text>
          </View>
        </View>
        <Text className="text-xs text-slate-500 mb-4">
          {isAllLocationsSelected
            ? `Aggregated Google performance across all ${locations.length} locations`
            : `Live Google Business Profile metrics for ${selectedLocation?.title || 'location'}`}
        </Text>

        <View className="flex-row gap-3 mb-3">
          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3.5 rounded-2xl"
          >
            <Eye size={17} color="#1E8E3E" />
            <Text className="text-xl font-bold text-slate-900 mt-1.5">
              {activeInsights.searchViews.toLocaleString()}
            </Text>
            <Text className="text-xs font-medium text-slate-600 mt-0.5">Search Views</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3.5 rounded-2xl"
          >
            <Navigation size={17} color="#2563EB" />
            <Text className="text-xl font-bold text-slate-900 mt-1.5">
              {activeInsights.mapsViews.toLocaleString()}
            </Text>
            <Text className="text-xs font-medium text-slate-600 mt-0.5">Maps Views</Text>
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3 rounded-2xl"
          >
            <PhoneCall size={15} color="#9333EA" />
            <Text className="text-base font-bold text-slate-900 mt-1">
              {activeInsights.callClicks.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Calls</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3 rounded-2xl"
          >
            <Globe size={15} color="#EA580C" />
            <Text className="text-base font-bold text-slate-900 mt-1">
              {activeInsights.websiteClicks.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Website</Text>
          </View>

          <View
            style={{ borderColor: '#EEF1F6', borderWidth: 1 }}
            className="flex-1 p-3 rounded-2xl"
          >
            <MapPin size={15} color="#0284C7" />
            <Text className="text-base font-bold text-slate-900 mt-1">
              {activeInsights.directionRequests.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mt-0.5">Directions</Text>
          </View>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 5. SELECTED LISTING DETAILS (OR ALL LOCATIONS SUMMARY)               */}
      {/* ==================================================================== */}
      {isAllLocationsSelected ? (
        <View className="bg-white mx-4 mt-3 rounded-2xl p-5 border border-slate-100">
          <View className="flex-row items-center mb-2">
            <Layers size={18} color="#2563EB" />
            <Text style={{ color: '#131A38' }} className="text-base font-bold ml-2">
              All Locations Overview ({locations.length})
            </Text>
          </View>
          <Text className="text-xs text-slate-500 leading-relaxed mb-3">
            Showing combined metrics across your {locations.length} Google Business Profile
            locations. Tap the location name in the top header bar anytime to switch to a specific
            branch.
          </Text>
        </View>
      ) : selectedLocation ? (
        <View className="bg-white mx-4 mt-3 rounded-2xl p-5 border border-slate-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: '#131A38' }} className="text-base font-bold flex-1 mr-2">
              Listing Information
            </Text>
            <View style={{ backgroundColor: '#EEF2FF' }} className="px-2.5 py-1 rounded-full">
              <Text style={{ color: '#1E40AF' }} className="text-[11px] font-semibold">
                {selectedLocation.categories?.primaryCategory?.displayName || 'GMB Listing'}
              </Text>
            </View>
          </View>

          <View className="gap-2.5">
            <View className="flex-row items-start">
              <MapPin size={15} color="#475569" style={{ marginTop: 2 }} />
              <Text className="text-xs text-slate-700 ml-2.5 flex-1 leading-relaxed">
                {[
                  ...(selectedLocation.storefrontAddress?.addressLines || []),
                  selectedLocation.storefrontAddress?.locality,
                  selectedLocation.storefrontAddress?.administrativeArea,
                  selectedLocation.storefrontAddress?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Address not specified on this Google listing'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <PhoneCall size={15} color="#475569" />
                <Text className="text-xs text-slate-700 ml-2.5 flex-1">
                  {selectedLocation.phoneNumbers?.primaryPhone || 'No phone number listed'}
                </Text>
              </View>
              {selectedLocation.phoneNumbers?.primaryPhone ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${selectedLocation.phoneNumbers?.primaryPhone}`).catch(
                      () => {}
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100"
                >
                  <Text className="text-[11px] font-semibold text-slate-700">Call</Text>
                </Pressable>
              ) : null}
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Globe size={15} color="#475569" />
                <Text className="text-xs text-slate-700 ml-2.5 flex-1" numberOfLines={1}>
                  {selectedLocation.websiteUri || 'No website linked'}
                </Text>
              </View>
              {selectedLocation.websiteUri ? (
                <Pressable
                  onPress={() =>
                    WebBrowser.openBrowserAsync(
                      selectedLocation.websiteUri!.startsWith('http')
                        ? selectedLocation.websiteUri!
                        : `https://${selectedLocation.websiteUri}`
                    ).catch(() => {})
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 flex-row items-center"
                >
                  <ExternalLink size={11} color="#334155" />
                  <Text className="text-[11px] font-semibold text-slate-700 ml-1">Open</Text>
                </Pressable>
              ) : null}
            </View>

            <View className="flex-row items-center">
              <Clock size={15} color="#475569" />
              <Text className="text-xs text-slate-700 ml-2.5 flex-1">
                {selectedLocation.regularHours?.periods?.length
                  ? `Operating hours configured (${selectedLocation.regularHours.periods.length} day periods)`
                  : 'Operating hours not configured'}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};
