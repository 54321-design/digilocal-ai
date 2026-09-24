import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Star, MessageSquare, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { GoogleReview } from '../types';

interface ReviewCardProps {
  review: GoogleReview;
  onPressReply?: () => void;
  onPressGenerateAI?: () => void;
  isGeneratingAI?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onPressReply,
  onPressGenerateAI,
  isGeneratingAI = false,
}) => {
  const isPublished = Boolean(review.reviewReply?.comment);
  const stars = Array.from({ length: 5 }, (_, i) => i < review.numericRating);

  const formattedDate = review.createTime
    ? new Date(review.createTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Card className="mb-3 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Avatar
            name={review.reviewer.displayName || 'Customer'}
            photoUrl={review.reviewer.profilePhotoUrl}
            size="sm"
          />
          <View className="ml-2.5 flex-1">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
              {review.reviewer.displayName || 'Google Reviewer'}
            </Text>
            <Text className="text-xs text-slate-400">{formattedDate}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {review.sentiment && (
            <Badge
              label={review.sentiment}
              variant={
                review.sentiment === 'positive'
                  ? 'success'
                  : review.sentiment === 'neutral'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
              className="mr-2"
            />
          )}
          {isPublished ? (
            <Badge label="Replied" variant="success" size="sm" />
          ) : (
            <Badge label="Unanswered" variant="warning" size="sm" />
          )}
        </View>
      </View>

      {/* Star Rating */}
      <View className="flex-row items-center mb-2">
        {stars.map((filled, idx) => (
          <Star
            key={idx}
            size={16}
            color={filled ? '#F59E0B' : '#CBD5E1'}
            fill={filled ? '#F59E0B' : 'transparent'}
          />
        ))}
        <Text className="ml-2 text-xs font-semibold text-slate-700">
          {review.numericRating}.0
        </Text>
      </View>

      {/* Comment */}
      <Text className="text-sm text-slate-700 leading-relaxed mb-3">
        {review.comment ? review.comment : <Text className="italic text-slate-400">No written comment provided.</Text>}
      </Text>

      {/* Existing Official Reply */}
      {review.reviewReply?.comment ? (
        <View className="bg-blue-50/70 border-l-2 border-blue-500 p-3 rounded-r-xl mb-2">
          <View className="flex-row items-center mb-1">
            <CheckCircle2 size={13} color="#2563eb" />
            <Text className="text-xs font-semibold text-blue-900 ml-1.5">
              Business Response (Google Confirmed)
            </Text>
          </View>
          <Text className="text-xs text-slate-700 leading-relaxed">
            {review.reviewReply.comment}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View className="flex-row items-center justify-end space-x-2 pt-2 border-t border-slate-100">
        {!isPublished && onPressGenerateAI && (
          <Pressable
            onPress={onPressGenerateAI}
            disabled={isGeneratingAI}
            className="flex-row items-center px-3 py-1.5 bg-indigo-50 rounded-lg active:bg-indigo-100 mr-2"
          >
            <Sparkles size={14} color="#6366f1" />
            <Text className="text-xs font-semibold text-indigo-700 ml-1.5">
              {isGeneratingAI ? 'Thinking...' : 'AI Reply'}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onPressReply}
          className="flex-row items-center px-3 py-1.5 bg-blue-600 rounded-lg active:bg-blue-700"
        >
          <MessageSquare size={14} color="#ffffff" />
          <Text className="text-xs font-semibold text-white ml-1.5">
            {isPublished ? 'Edit Reply' : 'Reply'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
};
