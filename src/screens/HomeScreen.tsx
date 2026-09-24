import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import {
  Store,
  Star,
  MessageSquare,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { useSEO } from '../context/SEOContext';
import { useCopilot } from '../context/CopilotContext';
import {
  MetricCard,
  Card,
  Badge,
  Button,
  ReviewCard,
  ActionCard,
  LoadingState,
  EmptyState,
} from '../components';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signInWithGoogle, signInAsDemo, accessToken } = useAuth();
  const { activeBusiness } = useBusiness();
  const {
    isConnected,
    locations,
    selectedLocation,
    refreshGoogleData,
    isLoading: isGoogleLoading,
  } = useGoogle();
  const {
    reviews,
    refreshReviews,
    isLoading: isReviewsLoading,
  } = useReviews();
  const { audit, runAudit } = useSEO();
  const { plan, generatePlan, isLoading: isCopilotLoading } = useCopilot();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    runAudit();
    setRefreshing(false);
  };

  // Real review stats
  const totalReviews = reviews.length;
  const unansweredCount = reviews.filter((r) => !r.reviewReply?.comment).length;
  const answeredCount = totalReviews - unansweredCount;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.numericRating, 0) / totalReviews).toFixed(1)
      : null;

  const responseRate =
    totalReviews > 0 ? `${((answeredCount / totalReviews) * 100).toFixed(0)}%` : null;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Top Banner / Business Header */}
      <View className="bg-white px-5 pt-4 pb-5 border-b border-slate-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-0.5">
              DigiLocal.ai Dashboard
            </Text>
            <Text className="text-xl font-extrabold text-slate-900" numberOfLines={1}>
              {activeBusiness?.name || 'My Local Business'}
            </Text>
          </View>
          {isConnected ? (
            <Badge label="Google Connected" variant="success" size="sm" />
          ) : (
            <Badge label="Google Disconnected" variant="danger" size="sm" />
          )}
        </View>

        {/* Selected Location Selector Bar */}
        {selectedLocation ? (
          <Pressable
            onPress={() => navigation.navigate('Locations')}
            className="flex-row items-center bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/60 active:bg-slate-200"
          >
            <MapPin size={16} color="#2563eb" className="mr-2" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                {selectedLocation.title}
              </Text>
              <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                {selectedLocation.storefrontAddress?.addressLines?.join(', ') ||
                  'No storefront address set'}
              </Text>
            </View>
            <Text className="text-[11px] font-semibold text-blue-600 ml-2">Switch</Text>
          </Pressable>
        ) : isConnected ? (
          <Pressable
            onPress={() => navigation.navigate('Locations')}
            className="p-3 bg-amber-50 rounded-xl border border-amber-200"
          >
            <Text className="text-xs font-semibold text-amber-800">
              No location selected. Tap here to manage locations.
            </Text>
          </Pressable>
        ) : (
          <View className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <Text className="text-xs font-bold text-blue-900 mb-1">
              Connect your Google Business Profile
            </Text>
            <Text className="text-[11px] text-blue-700 leading-normal mb-2.5">
              Sync official reviews, local SEO factors, and Google Maps visibility for this business.
            </Text>
            <Button
              title="⚡ Start Instant Preview (Expo Go)"
              onPress={signInAsDemo}
              size="md"
              variant="primary"
              className="mb-2 shadow-sm"
            />
            <Button
              title="Sign in with Google (Requires APK)"
              onPress={signInWithGoogle}
              size="sm"
              variant="outline"
              className="bg-white border-blue-200"
            />
          </View>
        )}
      </View>

      <View className="px-4 pt-4">
        {/* Metric Cards Grid */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Google Performance Metrics
        </Text>
        <View className="flex-row space-x-2 mb-3">
          <MetricCard
            title="Google Rating"
            value={averageRating ? `${averageRating} ★` : null}
            subtitle={totalReviews > 0 ? `Based on ${totalReviews} reviews` : undefined}
            unavailableMessage={isConnected ? 'No reviews yet' : 'Connect Google'}
            icon={<Star size={16} color="#f59e0b" />}
          />
          <MetricCard
            title="Total Reviews"
            value={isConnected ? totalReviews : null}
            subtitle={totalReviews > 0 ? `${unansweredCount} pending reply` : undefined}
            unavailableMessage="Connect Google"
            icon={<MessageSquare size={16} color="#2563eb" />}
          />
        </View>

        <View className="flex-row space-x-2 mb-4">
          <MetricCard
            title="Response Rate"
            value={responseRate}
            subtitle={responseRate ? `${answeredCount} of ${totalReviews} answered` : undefined}
            unavailableMessage="Data unavailable"
            icon={<CheckCircle size={16} color="#10b981" />}
          />
          <MetricCard
            title="SEO Health"
            value={audit ? `${audit.passedCount}/${audit.totalChecks} Checks` : null}
            subtitle={audit ? `${((audit.passedCount / audit.totalChecks) * 100).toFixed(0)}% passed` : undefined}
            unavailableMessage="Run audit in SEO"
            icon={<TrendingUp size={16} color="#6366f1" />}
          />
        </View>

        {/* AI Growth Copilot Recommendation Highlight */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <View className="flex-row items-center">
              <Sparkles size={16} color="#6366f1" />
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-800 ml-1.5">
                AI Growth Copilot
              </Text>
            </View>
            <Pressable onPress={() => navigation.navigate('AI')}>
              <Text className="text-xs font-semibold text-blue-600">Open Copilot →</Text>
            </Pressable>
          </View>

          {plan ? (
            <Card className="p-4 bg-gradient-to-r bg-white border border-indigo-100 shadow-sm">
              <Text className="text-xs font-semibold text-indigo-950 mb-2 leading-relaxed">
                {plan.summary}
              </Text>
              {plan.actionPlan.slice(0, 2).map((item, idx) => (
                <View key={idx} className="flex-row items-start mt-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 mr-2" />
                  <Text className="text-xs text-slate-700 flex-1 leading-normal">{item}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <Card className="p-4 bg-white border border-slate-200">
              <Text className="text-xs text-slate-600 mb-3">
                Generate an evidence-grounded action plan tailored to your Google profile and reviews.
              </Text>
              <Button
                title="Generate Weekly Growth Plan"
                onPress={generatePlan}
                loading={isCopilotLoading}
                size="sm"
                variant="outline"
              />
            </Card>
          )}
        </View>

        {/* Unanswered Reviews Attention Banner */}
        {unansweredCount > 0 && (
          <ActionCard
            title={`${unansweredCount} Reviews Awaiting Reply`}
            description="Responding swiftly to Google reviews boosts customer loyalty and enhances your local search visibility."
            priority="high"
            actionText="Reply with AI"
            onPress={() => navigation.navigate('Reviews')}
          />
        )}

        {/* Recent Reviews Preview */}
        <View className="mt-2 mb-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Google Reviews
            </Text>
            <Pressable onPress={() => navigation.navigate('Reviews')}>
              <Text className="text-xs font-semibold text-blue-600">View All →</Text>
            </Pressable>
          </View>

          {reviews.length > 0 ? (
            reviews.slice(0, 2).map((rev) => (
              <ReviewCard
                key={rev.id || rev.googleName}
                review={rev}
                onPressReply={() => navigation.navigate('Reviews')}
              />
            ))
          ) : (
            <Card className="p-6 items-center justify-center bg-white border border-slate-200">
              <Text className="text-xs text-slate-500">
                {isConnected ? 'No customer reviews found yet.' : 'Connect Google to view real customer reviews.'}
              </Text>
            </Card>
          )}
        </View>

        {/* Quick Access to Secondary Commerce Modules */}
        <Card className="p-4 bg-white border border-slate-200 mt-1">
          <Text className="text-xs font-bold text-slate-800 mb-2">Supporting Business Modules</Text>
          <View className="flex-row justify-between">
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'POS' })}
              className="items-center p-2 rounded-xl bg-slate-50 flex-1 mr-2"
            >
              <Text className="text-xs font-bold text-slate-800">Quick POS</Text>
              <Text className="text-[10px] text-slate-400">New Sale</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Khata' })}
              className="items-center p-2 rounded-xl bg-slate-50 flex-1 mr-2"
            >
              <Text className="text-xs font-bold text-slate-800">Khata</Text>
              <Text className="text-[10px] text-slate-400">Credit Ledger</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('More', { screen: 'Customers' })}
              className="items-center p-2 rounded-xl bg-slate-50 flex-1"
            >
              <Text className="text-xs font-bold text-slate-800">Customers</Text>
              <Text className="text-[10px] text-slate-400">Directory</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};
