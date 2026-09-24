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
  Search,
  Filter,
  Sparkles,
  Send,
  CheckCircle,
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
          description="Sign in with your Google account to fetch and reply to your official Google Business Profile reviews."
          actionTitle="Sign in with Google"
          onAction={signInWithGoogle}
        />
      ) : isLoading && !refreshing ? (
        <LoadingState message="Syncing reviews from Google..." />
      ) : error ? (
        <View className="p-4">
          <ErrorState message={error} onRetry={refreshReviews} />
        </View>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={32} color="#94a3b8" />}
          title="No Reviews Found"
          description={
            searchQuery
              ? 'No reviews matched your search criteria.'
              : 'There are no reviews under this filter for this location.'
          }
        />
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.id || item.googleName}
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
        title="Reply to Google Review"
      >
        {activeReviewForReply && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Customer review preview */}
            <View className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-100">
              <Text className="text-xs font-bold text-slate-800 mb-0.5">
                {activeReviewForReply.reviewer.displayName || 'Google Customer'} ({activeReviewForReply.numericRating}★)
              </Text>
              <Text className="text-xs text-slate-600 italic">
                "{activeReviewForReply.comment || 'No text comment provided'}"
              </Text>
            </View>

            {/* AI Assistant Configuration */}
            <Text className="text-xs font-bold text-slate-700 mb-2">AI Tone</Text>
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

            <Text className="text-xs font-bold text-slate-700 mb-2">Language</Text>
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
                {isGeneratingAI ? 'Generating AI Reply...' : 'Generate / Re-draft AI Reply'}
              </Text>
            </Pressable>

            {/* Editable Response Input */}
            <Text className="text-xs font-bold text-slate-700 mb-1">Your Response</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write or edit your reply here before publishing..."
              placeholderTextColor="#94a3b8"
              className="border border-slate-300 rounded-xl p-3 text-sm text-slate-800 bg-white mb-4 min-h-[90px]"
              textAlignVertical="top"
            />

            {/* Publish Button */}
            <Button
              title="Publish Reply to Google"
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
