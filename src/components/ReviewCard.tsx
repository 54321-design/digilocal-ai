import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Star, MessageSquare, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
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
    <View className="bg-white rounded-3xl p-4.5 mb-3 border border-slate-100 shadow-sm shadow-slate-200/50">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          <Avatar
            name={review.reviewer.displayName || 'Customer'}
            photoUrl={review.reviewer.profilePhotoUrl}
            size="sm"
          />
          <View className="ml-2.5 flex-1">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
              {review.reviewer.displayName || 'Google Reviewer'}
            </Text>
            <Text className="text-[11px] text-slate-400">{formattedDate}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {review.sentiment && (
            <View
              className={`mr-2 px-2.5 py-0.5 rounded-full ${
                review.sentiment === 'positive'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : review.sentiment === 'neutral'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-rose-50 border border-rose-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  review.sentiment === 'positive'
                    ? 'text-emerald-700'
                    : review.sentiment === 'neutral'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {review.sentiment}
              </Text>
            </View>
          )}
          <View
            className={`px-2.5 py-0.5 rounded-full ${
              isPublished
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-orange-50 border border-orange-200'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isPublished ? 'text-emerald-700' : 'text-orange-700'
              }`}
            >
              {isPublished ? 'Replied' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Star Rating */}
      <View className="flex-row items-center mb-2">
        {stars.map((filled, idx) => (
          <Star
            key={idx}
            size={14}
            color={filled ? '#F59E0B' : '#E2E8F0'}
            fill={filled ? '#F59E0B' : 'transparent'}
          />
        ))}
        <Text className="ml-2 text-xs font-bold text-slate-700">
          {review.numericRating}.0
        </Text>
      </View>

      {/* Comment */}
      <Text className="text-xs text-slate-700 leading-relaxed mb-3">
        {review.comment ? (
          review.comment
        ) : (
          <Text className="italic text-slate-400">Rating provided without written comment.</Text>
        )}
      </Text>

      {/* Existing Official Reply */}
      {review.reviewReply?.comment ? (
        <View className="bg-slate-50 border-l-2 border-slate-900 p-3 rounded-r-2xl mb-3">
          <View className="flex-row items-center mb-1">
            <CheckCircle2 size={12} color="#0F172A" />
            <Text className="text-[11px] font-bold text-slate-900 ml-1.5">
              Official Storefront Response
            </Text>
          </View>
          <Text className="text-xs text-slate-600 leading-relaxed">
            {review.reviewReply.comment}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View className="flex-row items-center justify-end pt-2 border-t border-slate-100 gap-2">
        {!isPublished && onPressGenerateAI && (
          <Pressable
            onPress={onPressGenerateAI}
            disabled={isGeneratingAI}
            className="flex-row items-center px-3.5 py-1.5 bg-orange-50 rounded-full border border-orange-200/50 active:bg-orange-100"
          >
            <Sparkles size={13} color="#EA580C" />
            <Text className="text-xs font-bold text-orange-700 ml-1.5">
              {isGeneratingAI ? 'Drafting...' : 'AI Quick Reply'}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onPressReply}
          className="flex-row items-center px-4 py-1.5 bg-neutral-900 rounded-full active:bg-black shadow-xs"
        >
          <MessageSquare size={13} color="#ffffff" />
          <Text className="text-xs font-bold text-white ml-1.5">
            {isPublished ? 'Edit Reply' : 'Reply'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
