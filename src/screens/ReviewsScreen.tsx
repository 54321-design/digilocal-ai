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
  MapPin,
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
  const { locations, selectedLocation, selectLocation, isConnected, isSyncingLocation } =
    useGoogle();
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
      <Card className="mb-4 bg-white border-slate-100">
        <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <View>
            <Text style={{ color: '#4A4E58' }} className="text-[18px] font-bold">
              Review Sentiment Summary
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              {selectedLocation?.title || 'Connected Business Profile'}
            </Text>
          </View>
          <View
            style={{ backgroundColor: '#FEF9E7' }}
            className="flex-row items-center px-3 py-1.5 rounded-full"
          >
            <Star size={14} color="#F4B400" fill="#F4B400" />
            <Text style={{ color: '#785A08' }} className="text-xs font-bold ml-1.5">
              {sentimentReport.averageRating} / 5.0
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2.5 mb-3">
          <View
            style={{ backgroundColor: '#ECFDF3' }}
            className="flex-1 p-3 rounded-2xl items-center"
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
            className="flex-1 p-3 rounded-2xl items-center"
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
            className="flex-1 p-3 rounded-2xl items-center"
          >
            <Text style={{ color: '#991B1B' }} className="text-base font-bold">
              {sentimentReport.negativePercentage}%
            </Text>
            <Text style={{ color: '#991B1B' }} className="text-xs mt-0.5">
              Negative
            </Text>
          </View>
        </View>

        <View className="h-2 w-full rounded-full bg-slate-100 flex-row overflow-hidden mb-3.5">
          <View
            style={{ width: `${sentimentReport.positivePercentage}%`, backgroundColor: '#1E8E3E' }}
            className="h-full"
          />
          <View
            style={{ width: `${sentimentReport.neutralPercentage}%`, backgroundColor: '#F4B400' }}
            className="h-full"
          />
          <View
            style={{ width: `${sentimentReport.negativePercentage}%`, backgroundColor: '#EF4444' }}
            className="h-full"
          />
        </View>

        <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3">
          <Text className="text-xs font-semibold text-slate-800 mb-1">Overview</Text>
          <Text className="text-xs text-slate-600 leading-relaxed mb-2.5">
            {sentimentReport.summary}
          </Text>

          <Text className="text-xs text-slate-700 mb-1">
            <Text className="font-semibold text-emerald-700">Strengths: </Text>
            {sentimentReport.strengths.join(', ')}
          </Text>
          <Text className="text-xs text-slate-700 mb-1">
            <Text className="font-semibold text-rose-700">Focus areas: </Text>
            {sentimentReport.improvementAreas.join(', ')}
          </Text>
          <Text className="text-xs text-slate-600 mt-1 pt-2 border-t border-slate-200/60">
            <Text className="font-semibold text-slate-800">Recommendation: </Text>
            {sentimentReport.actionableAdvice}
          </Text>
        </View>

        <Button
          title={isAnalyzingSentiment ? 'Refreshing...' : 'Refresh Sentiment Summary'}
          onPress={runSentimentAnalysis}
          loading={isAnalyzingSentiment}
          size="sm"
          variant="secondary"
        />
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Search, Location Switcher, and Filters Header */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-100">
        {locations.length > 0 && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Location ({locations.length})
              </Text>
              {isSyncingLocation || isLoading ? (
                <Text className="text-[11px] font-medium text-blue-600">
                  Loading live reviews...
                </Text>
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
                    className="mr-2 px-3 py-1.5 rounded-xl flex-row items-center"
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
