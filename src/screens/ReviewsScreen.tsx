import React, { useState } from 'react';
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
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  TrendingUp,
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
  const { selectedLocation, isConnected } = useGoogle();
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

  const renderSentimentHeader = () => {
    if (!sentimentReport) return null;

    return (
      <Card className="mb-4 bg-white border-indigo-100">
        <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center">
            <Sparkles size={18} color="#4f46e5" className="mr-2" />
            <View>
              <Text className="text-sm font-bold text-slate-900">AI Review Sentiment Analysis</Text>
              <Text className="text-[11px] text-slate-500">
                {selectedLocation?.title || 'Connected GMB Profile'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-xs font-extrabold text-amber-800 ml-1">
              {sentimentReport.averageRating} / 5.0
            </Text>
          </View>
        </View>

        {/* Positive / Neutral / Negative Breakdown Pills */}
        <View className="flex-row space-x-2 mb-3">
          <View className="flex-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 items-center">
            <View className="flex-row items-center mb-0.5">
              <ThumbsUp size={13} color="#10b981" />
              <Text className="text-xs font-extrabold text-emerald-700 ml-1">
                {sentimentReport.positivePercentage}%
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-emerald-600 uppercase">Positive</Text>
          </View>

          <View className="flex-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200 items-center">
            <View className="flex-row items-center mb-0.5">
              <MinusCircle size={13} color="#f59e0b" />
              <Text className="text-xs font-extrabold text-amber-700 ml-1">
                {sentimentReport.neutralPercentage}%
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-amber-600 uppercase">Average</Text>
          </View>

          <View className="flex-1 bg-rose-50 p-2.5 rounded-xl border border-rose-200 items-center">
            <View className="flex-row items-center mb-0.5">
              <ThumbsDown size={13} color="#ef4444" />
              <Text className="text-xs font-extrabold text-rose-700 ml-1">
                {sentimentReport.negativePercentage}%
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-rose-600 uppercase">Negative</Text>
          </View>
        </View>

        {/* Visual Distribution Bar */}
        <View className="h-2.5 w-full rounded-full bg-slate-100 flex-row overflow-hidden mb-3">
          <View
            style={{ width: `${sentimentReport.positivePercentage}%` }}
            className="bg-emerald-500 h-full"
          />
          <View
            style={{ width: `${sentimentReport.neutralPercentage}%` }}
            className="bg-amber-400 h-full"
          />
          <View
            style={{ width: `${sentimentReport.negativePercentage}%` }}
            className="bg-rose-500 h-full"
          />
        </View>

        {/* AI Summary & Insights */}
        <View className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 mb-3">
          <Text className="text-xs font-bold text-indigo-950 mb-1">Gemini Executive Verdict:</Text>
          <Text className="text-xs text-slate-700 leading-relaxed mb-2">
            {sentimentReport.summary}
          </Text>

          <View className="mb-1.5">
            <Text className="text-[11px] font-bold text-emerald-700">
              ✓ Top Praises: {sentimentReport.strengths.join(' • ')}
            </Text>
          </View>
          <View className="mb-1.5">
            <Text className="text-[11px] font-bold text-rose-700">
              ⚠ Watchlist: {sentimentReport.improvementAreas.join(' • ')}
            </Text>
          </View>
          <View className="pt-1.5 border-t border-indigo-100 mt-1">
            <Text className="text-[11px] font-semibold text-indigo-800">
              💡 GMB Growth Tip: {sentimentReport.actionableAdvice}
            </Text>
          </View>
        </View>

        <Button
          title={isAnalyzingSentiment ? 'Analyzing with Gemini AI...' : 'Refresh Deep AI Sentiment Analysis'}
          onPress={runSentimentAnalysis}
          loading={isAnalyzingSentiment}
          size="sm"
          variant="secondary"
          icon={<Sparkles size={14} color="#4f46e5" />}
        />
      </Card>
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
              className={`mr-2 px-3 py-1.5 rounded-full border ${
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
          description="Sign in with your Google Business Profile Gmail to fetch your customer reviews, run AI sentiment analysis, and post replies directly to Google."
          actionTitle="Sign in with Google"
          onAction={signInWithGoogle}
        />
      ) : isLoading && !refreshing ? (
        <LoadingState message="Syncing reviews & running sentiment analysis..." />
      ) : error ? (
        <View className="p-4">
          <ErrorState message={error} onRetry={refreshReviews} />
        </View>
      ) : filteredReviews.length === 0 ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {renderSentimentHeader()}
          <EmptyState
            icon={<MessageSquare size={32} color="#94a3b8" />}
            title="No Reviews Found"
            description={
              searchQuery
                ? 'No reviews matched your search criteria.'
                : 'There are no reviews under this filter for this location.'
            }
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id || item.googleName}
          ListHeaderComponent={renderSentimentHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16 }}
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Customer review preview */}
            <View className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-slate-800">
                  {activeReviewForReply.reviewer.displayName || 'Google Customer'} ({activeReviewForReply.numericRating}★)
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
              <Text className="text-xs text-slate-600 italic">
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
                  className={`mr-2 px-2.5 py-1 rounded-lg border ${
                    selectedTone === t.key
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      selectedTone === t.key ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-xs font-bold text-slate-700 mb-2">Reply Language</Text>
            <View className="flex-row mb-3">
              {languages.map((l) => (
                <Pressable
                  key={l.key}
                  onPress={() => setSelectedLanguage(l.key)}
                  className={`mr-2 px-2.5 py-1 rounded-lg border ${
                    selectedLanguage === l.key
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
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
              className="flex-row items-center justify-center p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl mb-4 active:bg-indigo-100"
            >
              <Sparkles size={16} color="#6366f1" />
              <Text className="text-xs font-bold text-indigo-700 ml-2">
                {isGeneratingAI ? 'Gemini AI is drafting reply...' : 'Generate AI Reply Now'}
              </Text>
            </Pressable>

            {/* Editable Response Input */}
            <Text className="text-xs font-bold text-slate-700 mb-1">
              Reply Message (Will be posted publicly on Google)
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Click 'Generate AI Reply Now' or write your response..."
              placeholderTextColor="#94a3b8"
              className="border border-slate-300 rounded-xl p-3 text-sm text-slate-800 bg-white mb-4 min-h-[90px]"
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
