import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  MessageSquare,
  Sparkles,
  Send,
  Star,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useReviews } from '../context/ReviewsContext';
import { useGoogle } from '../context/GoogleContext';
import { useAuth } from '../context/AuthContext';
import { GoogleReview } from '../types';
import { ReplyLanguage, ReplyTone } from '../services/ai/gemini';
import {
  ReviewCard,
  SearchBar,
  BottomSheet,
  Button,
  Badge,
  Card,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../components';

export const ReviewsScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { selectedLocation, isAllLocationsSelected, isConnected } = useGoogle();
  const {
    reviews,
    filteredReviews,
    isLoading,
    error,
    refreshReviews,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sentimentReport,
    isAnalyzingSentiment,
    runSentimentAnalysis,
    generateAIReply,
    publishReply,
    isPublishing,
    isGeneratingAI,
  } = useReviews();

  const [refreshing, setRefreshing] = useState(false);

  // Modal / Reply state
  const [activeReviewForReply, setActiveReviewForReply] = useState<GoogleReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedTone, setSelectedTone] = useState<ReplyTone>('professional');
  const [selectedLanguage, setSelectedLanguage] = useState<ReplyLanguage>('en');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshReviews();
    setRefreshing(false);
  };

  // Real metrics computed from verified Google reviews
  const totalReviews = reviews.length;
  const unansweredCount = useMemo(
    () => reviews.filter((r) => !r.reviewReply?.comment).length,
    [reviews]
  );
  const answeredCount = totalReviews - unansweredCount;
  const responseRate =
    totalReviews > 0 ? Math.round((answeredCount / totalReviews) * 100) : 0;

  const averageRating = useMemo(() => {
    if (sentimentReport?.averageRating) return Number(sentimentReport.averageRating).toFixed(1);
    if (totalReviews === 0) return '0.0';
    return (reviews.reduce((s, r) => s + r.numericRating, 0) / totalReviews).toFixed(1);
  }, [sentimentReport, reviews, totalReviews]);

  const { newThisMonth, ratingDeltaText } = useMemo(() => {
    if (reviews.length === 0) {
      return { newThisMonth: 0, ratingDeltaText: '0 reviews' };
    }
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = reviews.filter(
      (r) => new Date(r.createTime || 0).getTime() >= thirtyDaysAgo
    );
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
        newThisMonth: recent.length,
        ratingDeltaText: `${sign}${diff} this month`,
      };
    }

    return {
      newThisMonth: recent.length,
      ratingDeltaText: `${recent.length} in last 30d`,
    };
  }, [reviews]);

  const handleOpenReplyModal = (review: GoogleReview) => {
    setActiveReviewForReply(review);
    setReplyText(review.reviewReply?.comment || '');
  };

  const handleGenerateAI = async () => {
    if (!activeReviewForReply) return;
    const generated = await generateAIReply(activeReviewForReply, selectedTone, selectedLanguage);
    if (generated) {
      setReplyText(generated);
    }
  };

  const handlePublish = async () => {
    if (!activeReviewForReply || !replyText.trim()) return;
    const success = await publishReply(activeReviewForReply, replyText);
    if (success) {
      setActiveReviewForReply(null);
      setReplyText('');
    }
  };

  const filters: Array<{ label: string; key: typeof filter }> = [
    { label: 'All', key: 'all' },
    { label: 'Unanswered', key: 'unanswered' },
    { label: 'Answered', key: 'answered' },
    { label: 'Positive', key: 'positive' },
    { label: 'Negative', key: 'negative' },
  ];

  const tones: Array<{ label: string; key: ReplyTone }> = [
    { label: 'Professional', key: 'professional' },
    { label: 'Friendly', key: 'friendly' },
    { label: 'Warm', key: 'warm' },
    { label: 'Concise', key: 'concise' },
    { label: 'Apologetic', key: 'apologetic' },
  ];

  const languages: Array<{ label: string; key: ReplyLanguage }> = [
    { label: 'English', key: 'en' },
    { label: 'Hindi (हिंदी)', key: 'hi' },
    { label: 'Hinglish', key: 'hinglish' },
  ];

  const renderHeaderSection = () => {
    return (
      <View className="mb-3">
        {/* Horizontal Scrollable Review KPI Cards (100% Real Data) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
        >
          {/* Card 1: Rating */}
          <View
            style={{ width: 154, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <Star size={15} color="#F4B400" fill="#F4B400" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Rating</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1">
              {totalReviews > 0 ? averageRating : '—'}
            </Text>
            <Text className="text-xs font-medium text-emerald-700" numberOfLines={1}>
              {ratingDeltaText}
            </Text>
          </View>

          {/* Card 2: Total Reviews */}
          <View
            style={{ width: 154, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <MessageSquare size={15} color="#2563EB" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Reviews</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1">
              {totalReviews}
            </Text>
            <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
              {newThisMonth} new (30d)
            </Text>
          </View>

          {/* Card 3: Needs Reply */}
          <Pressable
            onPress={() => setFilter('unanswered')}
            style={{ width: 154, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <Clock size={15} color="#DC2626" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Unanswered</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1">
              {unansweredCount}
            </Text>
            <Text className="text-xs font-medium text-rose-600" numberOfLines={1}>
              {unansweredCount > 0 ? 'Needs reply' : 'All replied'}
            </Text>
          </Pressable>

          {/* Card 4: Response Rate */}
          <Pressable
            onPress={() => setFilter('answered')}
            style={{ width: 154, borderColor: '#E2E8F0', borderWidth: 1 }}
            className="bg-white rounded-2xl p-4 justify-between"
          >
            <View className="flex-row items-center">
              <CheckCircle2 size={15} color="#16A34A" />
              <Text className="text-xs font-semibold text-slate-600 ml-1.5">Replied</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 my-1">
              {responseRate}%
            </Text>
            <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
              {answeredCount} of {totalReviews} answered
            </Text>
          </Pressable>
        </ScrollView>

        {/* Sentiment Summary Card */}
        {sentimentReport && (
          <Card className="bg-white border-slate-100 mt-1">
            <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <View className="flex-1 mr-2">
                <Text style={{ color: '#131A38' }} className="text-base font-bold">
                  Review Sentiment Breakdown
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                  {isAllLocationsSelected
                    ? 'All Google Business Locations'
                    : selectedLocation?.title || 'Connected Business Profile'}
                </Text>
              </View>
              <Pressable
                onPress={runSentimentAnalysis}
                disabled={isAnalyzingSentiment}
                className="px-3 py-1.5 rounded-xl bg-slate-100"
              >
                <Text className="text-xs font-semibold text-slate-700">
                  {isAnalyzingSentiment ? 'Analyzing...' : 'AI Insights'}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2.5 mb-3">
              <View
                style={{ backgroundColor: '#ECFDF3' }}
                className="flex-1 p-2.5 rounded-2xl items-center"
              >
                <Text style={{ color: '#166534' }} className="text-base font-bold">
                  {sentimentReport.positivePercentage}%
                </Text>
                <Text style={{ color: '#166534' }} className="text-xs mt-0.5">
                  Positive
                </Text>
              </View>

              <View
                style={{ backgroundColor: '#FEF9E7' }}
                className="flex-1 p-2.5 rounded-2xl items-center"
              >
                <Text style={{ color: '#785A08' }} className="text-base font-bold">
                  {sentimentReport.neutralPercentage}%
                </Text>
                <Text style={{ color: '#785A08' }} className="text-xs mt-0.5">
                  Average
                </Text>
              </View>

              <View
                style={{ backgroundColor: '#FEF2F2' }}
                className="flex-1 p-2.5 rounded-2xl items-center"
              >
                <Text style={{ color: '#991B1B' }} className="text-base font-bold">
                  {sentimentReport.negativePercentage}%
                </Text>
                <Text style={{ color: '#991B1B' }} className="text-xs mt-0.5">
                  Negative
                </Text>
              </View>
            </View>

            <Text className="text-xs text-slate-600 leading-relaxed">
              {sentimentReport.summary}
            </Text>
          </Card>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Search and Filters Header */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search reviews by customer or keywords..."
          className="mb-3"
        />

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                filter === f.key
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200 active:bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === f.key ? 'text-white' : 'text-slate-600'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Review List */}
      {!isConnected ? (
        <EmptyState
          icon={<MessageSquare size={32} color="#2563eb" />}
          title="Connect Google for Reviews"
          description="Sign in with your Google Business Profile Gmail to fetch your customer reviews, view sentiment breakdown, and post replies directly to Google."
          actionTitle="Sign in with Google"
          onAction={signInWithGoogle}
        />
      ) : isLoading && !refreshing && reviews.length === 0 ? (
        <LoadingState message="Syncing verified Google reviews..." />
      ) : error && reviews.length === 0 ? (
        <View className="p-4">
          <ErrorState message={error} onRetry={refreshReviews} />
        </View>
      ) : filteredReviews.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {renderHeaderSection()}
          <EmptyState
            icon={<MessageSquare size={32} color="#94a3b8" />}
            title="No Reviews Found"
            description={
              searchQuery
                ? 'No reviews matched your search criteria.'
                : 'There are no reviews under this filter for the selected location.'
            }
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id || item.googleName}
          ListHeaderComponent={renderHeaderSection}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              onPressReply={() => handleOpenReplyModal(item)}
              onPressGenerateAI={async () => {
                handleOpenReplyModal(item);
                const generated = await generateAIReply(item, 'professional', 'en');
                if (generated) setReplyText(generated);
              }}
            />
          )}
        />
      )}

      {/* Reply BottomSheet Modal */}
      <BottomSheet
        visible={Boolean(activeReviewForReply)}
        onClose={() => setActiveReviewForReply(null)}
        title="AI Reply & Direct GMB Post"
      >
        {activeReviewForReply && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Customer review preview */}
            <View className="p-3.5 bg-slate-50 rounded-xl mb-3 border border-slate-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-slate-800 flex-1 mr-2">
                  {activeReviewForReply.reviewer.displayName || 'Google Customer'} (
                  {activeReviewForReply.numericRating}★)
                </Text>
                <Badge
                  label={
                    activeReviewForReply.numericRating >= 4
                      ? 'Positive'
                      : activeReviewForReply.numericRating === 3
                      ? 'Average'
                      : 'Negative'
                  }
                  variant={
                    activeReviewForReply.numericRating >= 4
                      ? 'success'
                      : activeReviewForReply.numericRating === 3
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                />
              </View>
              <Text className="text-xs text-slate-600 italic leading-relaxed">
                "{activeReviewForReply.comment || 'No text comment provided'}"
              </Text>
            </View>

            {/* AI Assistant Configuration */}
            <Text className="text-xs font-bold text-slate-700 mb-2">Select AI Tone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
              {tones.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setSelectedTone(t.key)}
                  className={`mr-2 px-3 py-1.5 rounded-lg border ${
                    selectedTone === t.key
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedTone === t.key ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-xs font-bold text-slate-700 mb-2">Reply Language</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {languages.map((l) => (
                <Pressable
                  key={l.key}
                  onPress={() => setSelectedLanguage(l.key)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    selectedLanguage === l.key
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedLanguage === l.key ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Trigger AI Draft */}
            <Pressable
              onPress={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex-row items-center justify-center p-3 bg-indigo-50 border border-indigo-200 rounded-xl mb-4 active:bg-indigo-100"
            >
              <Sparkles size={16} color="#6366f1" />
              <Text className="text-xs font-bold text-indigo-700 ml-2">
                {isGeneratingAI ? 'Gemini AI is drafting reply...' : 'Generate AI Reply Now'}
              </Text>
            </Pressable>

            {/* Editable Response Input */}
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Reply Message (Posted publicly on Google)
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Tap 'Generate AI Reply Now' or write your response..."
              placeholderTextColor="#94a3b8"
              className="border border-slate-300 rounded-xl p-3 text-sm text-slate-800 bg-white mb-4 min-h-[96px]"
              textAlignVertical="top"
            />

            {/* Publish Button */}
            <Button
              title="Post Reply Directly to GMB"
              onPress={handlePublish}
              loading={isPublishing}
              disabled={!replyText.trim() || isPublishing}
              icon={<Send size={16} color="#ffffff" />}
              variant="primary"
            />
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
};
