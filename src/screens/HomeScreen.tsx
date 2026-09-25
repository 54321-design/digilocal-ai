import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import {
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Share2,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  Eye,
  Navigation,
  Globe,
  Radio,
  ChevronDown,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useGoogle } from '../context/GoogleContext';
import { useReviews } from '../context/ReviewsContext';
import { usePosts } from '../context/PostsContext';
import { useSocial } from '../context/SocialContext';
import { useSEO } from '../context/SEOContext';
import { useCopilot } from '../context/CopilotContext';
import {
  MetricCard,
  Card,
  Badge,
  Button,
} from '../components';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isConnected, locations, selectedLocation, selectLocation, refreshGoogleData } = useGoogle();
  const { reviews, refreshReviews } = useReviews();
  const { posts, n8nWebhookUrl } = usePosts();
  const { connectors, connectedCount } = useSocial();
  const { webAudit, runWebAudit } = useSEO();
  const { plan, generatePlan } = useCopilot();
  const { signInAsDemo } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshGoogleData(), refreshReviews()]);
    runWebAudit();
    setRefreshing(false);
  };

  // Review stats
  const totalReviews = reviews.length;
  const unansweredCount = reviews.filter((r) => !r.reviewReply?.comment).length;
  const answeredCount = totalReviews - unansweredCount;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.numericRating, 0) / totalReviews).toFixed(1)
      : '4.8';

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const nextPost = posts.find((p) => p.status === 'scheduled');

  const insights = selectedLocation?.insights || {
    mapsViews: 24510,
    searchViews: 18240,
    callClicks: 940,
    websiteClicks: 1420,
    directionRequests: 620,
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Top Multi-Location Switcher Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-slate-100">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mr-2">
              DigiLocal GMB Suite
            </Text>
            <Badge
              label={`${locations.length || 3} Locations`}
              variant="primary"
              size="sm"
            />
          </View>
          {selectedLocation?.verificationStatus === 'VERIFIED' ? (
            <Badge label="Verified Profile" variant="success" size="sm" />
          ) : (
            <Badge label="Active Store" variant="neutral" size="sm" />
          )}
        </View>

        {/* Location Selector Bar */}
        <Pressable
          onPress={() => setShowLocationPicker(true)}
          className="flex-row items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/90 active:bg-slate-100"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-8 h-8 rounded-xl bg-blue-100 items-center justify-center mr-2.5">
              <MapPin size={18} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900" numberOfLines={1}>
                {selectedLocation?.title || 'DigiLocal Super Store (Sector 18, Noida)'}
              </Text>
              <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                {selectedLocation?.storefrontAddress?.addressLines?.join(', ') ||
                  'Plot 42, Sector 18, Commercial Belt, Noida'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center bg-white px-2 py-1 rounded-lg border border-slate-200">
            <Text className="text-[11px] font-bold text-blue-600 mr-1">Switch</Text>
            <ChevronDown size={14} color="#2563eb" />
          </View>
        </Pressable>
      </View>

      <View className="px-4 pt-4">
        {/* Google Maps Performance Metrics */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Google Maps & Search Insights
        </Text>
        <View className="flex-row space-x-2 mb-2.5">
          <MetricCard
            title="Maps Views"
            value={insights.mapsViews.toLocaleString()}
            subtitle="+18% vs last month"
            icon={<Eye size={16} color="#2563eb" />}
          />
          <MetricCard
            title="Search Impressions"
            value={insights.searchViews.toLocaleString()}
            subtitle="Local customer queries"
            icon={<TrendingUp size={16} color="#10b981" />}
          />
        </View>

        <View className="flex-row space-x-2 mb-4">
          <MetricCard
            title="Phone Calls"
            value={insights.callClicks.toLocaleString()}
            subtitle="Direct customer leads"
            icon={<PhoneCall size={16} color="#f59e0b" />}
          />
          <MetricCard
            title="Directions"
            value={insights.directionRequests.toLocaleString()}
            subtitle="Storefront visits"
            icon={<Navigation size={16} color="#6366f1" />}
          />
        </View>

        {/* Post Scheduling & n8n Automation Highlight */}
        <Card className="mb-4 bg-white border-blue-100 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Calendar size={18} color="#2563eb" className="mr-2" />
              <Text className="text-sm font-extrabold text-slate-900">Post Scheduling (n8n)</Text>
            </View>
            <Badge label={`${scheduledCount} Scheduled`} variant="primary" size="sm" />
          </View>

          {nextPost ? (
            <View className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[10px] font-bold text-blue-600 uppercase">Upcoming Post</Text>
                <Text className="text-[11px] text-slate-500">
                  {new Date(nextPost.scheduledTime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text className="text-xs text-slate-800 font-medium" numberOfLines={2}>
                {nextPost.summary}
              </Text>
              <View className="flex-row items-center mt-2 flex-wrap gap-1">
                {nextPost.channels.map((ch) => (
                  <View key={ch} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Text className="text-[9px] font-bold text-slate-600 uppercase">{ch}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text className="text-xs text-slate-600 mb-3">
              Schedule promotional offers, product arrivals, and updates across Google, Instagram, Facebook, and LinkedIn.
            </Text>
          )}

          <Button
            title="Create & Schedule New Post"
            onPress={() => navigation.navigate('Posts')}
            size="sm"
            variant="primary"
          />
        </Card>

        {/* AI Review Responder Card */}
        <Card className="mb-4 bg-white border-slate-200 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <MessageSquare size={18} color="#10b981" className="mr-2" />
              <Text className="text-sm font-extrabold text-slate-900">AI Review Responder</Text>
            </View>
            <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Star size={12} color="#f59e0b" fill="#f59e0b" className="mr-1" />
              <Text className="text-xs font-bold text-amber-800">{averageRating} ★</Text>
            </View>
          </View>

          <Text className="text-xs text-slate-600 mb-3">
            {unansweredCount > 0
              ? `${unansweredCount} customer reviews are waiting for response. Gemini AI generates instant replies in Hindi, Hinglish, or English.`
              : 'All Google reviews responded to! Great customer trust score.'}
          </Text>

          <View className="flex-row space-x-2">
            <Button
              title="Open Review Responder"
              onPress={() => navigation.navigate('Reviews')}
              size="sm"
              variant="outline"
              className="flex-1 bg-white border-slate-300"
            />
            <Button
              title="Generate AI Reply"
              onPress={() => navigation.navigate('Reviews')}
              size="sm"
              variant="primary"
              className="flex-1"
            />
          </View>
        </Card>

        {/* Social Connectors & Omnichannel Presence */}
        <Card className="mb-4 bg-white border-purple-100 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Share2 size={18} color="#8b5cf6" className="mr-2" />
              <Text className="text-sm font-extrabold text-slate-900">Social Media Connectors</Text>
            </View>
            <Badge label={`${connectedCount}/3 Connected`} variant="success" size="sm" />
          </View>

          <View className="flex-row space-x-2 mb-3">
            {connectors.map((c) => (
              <View
                key={c.id}
                className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center"
              >
                <Text className="text-[10px] font-bold text-slate-500 uppercase">{c.platform}</Text>
                <Text className="text-xs font-extrabold text-slate-800" numberOfLines={1}>
                  {c.connected ? 'Active ✓' : 'Link'}
                </Text>
              </View>
            ))}
          </View>

          <Button
            title="Manage Social Channels"
            onPress={() => navigation.navigate('Social')}
            size="sm"
            variant="outline"
            className="bg-white border-purple-200"
          />
        </Card>

        {/* Web & 3-Pack Audit Preview */}
        <Card className="mb-4 bg-white border-slate-200 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Globe size={18} color="#2563eb" className="mr-2" />
              <Text className="text-sm font-extrabold text-slate-900">Web & 3-Pack Audit</Text>
            </View>
            <Badge
              label={`${webAudit?.overallScore || 88}/100 Health`}
              variant="success"
              size="sm"
            />
          </View>
          <Text className="text-xs text-slate-600 mb-3">
            Audit website performance, mobile friendliness, Schema.org LocalBusiness tags, and Google 3-Pack rankings.
          </Text>
          <Button
            title="Inspect Full Web Audit"
            onPress={() => navigation.navigate('Audit')}
            size="sm"
            variant="outline"
            className="bg-white border-slate-300"
          />
        </Card>

        {/* AI Growth Copilot Tip */}
        <Card className="mb-4 bg-linear-to-r from-blue-600 to-indigo-700 p-4 border-0">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Sparkles size={18} color="#ffffff" className="mr-2" />
              <Text className="text-sm font-extrabold text-white">AI Suggestion of the Day</Text>
            </View>
            <Badge label="Gemini AI" variant="primary" size="sm" />
          </View>
          <Text className="text-xs text-blue-50 leading-relaxed mb-3">
            "Your Noida branch has 3 unanswered positive reviews with high keyword potential. Post a 20% weekend offer post on GMB & Instagram to boost your 3-Pack visibility by 22%."
          </Text>
          <Button
            title="View 7-Day AI Growth Plan"
            onPress={() => navigation.navigate('AI')}
            size="sm"
            variant="secondary"
            className="bg-white"
          />
        </Card>
      </View>

      {/* Multi-Location Switcher Modal */}
      <Modal visible={showLocationPicker} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[75%]">
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <View>
                <Text className="text-base font-extrabold text-slate-900">Switch Location</Text>
                <Text className="text-xs text-slate-500">
                  Select Google Business Profile location to manage
                </Text>
              </View>
              <Pressable onPress={() => setShowLocationPicker(false)}>
                <Text className="text-xs font-bold text-blue-600">Close</Text>
              </Pressable>
            </View>

            <ScrollView className="mb-4">
              {locations.map((loc) => {
                const isCurrent =
                  (selectedLocation?.id || selectedLocation?.googleName) === (loc.id || loc.googleName);
                return (
                  <Pressable
                    key={loc.id || loc.googleName}
                    onPress={() => {
                      selectLocation(loc.id || loc.googleName);
                      setShowLocationPicker(false);
                    }}
                    className={`p-3.5 rounded-2xl mb-2.5 border ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-500'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-1">
                      <Text className="text-sm font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                        {loc.title}
                      </Text>
                      <Badge
                        label={loc.verificationStatus || 'VERIFIED'}
                        variant={loc.verificationStatus === 'ACTION_REQUIRED' ? 'warning' : 'success'}
                        size="sm"
                      />
                    </View>
                    <Text className="text-xs text-slate-500" numberOfLines={1}>
                      {loc.storefrontAddress?.addressLines?.join(', ') || 'Storefront Address'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
