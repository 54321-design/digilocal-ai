import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <View className={`items-center justify-center py-12 ${className}`}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="text-xs font-semibold text-slate-500 mt-3">{message}</Text>
    </View>
  );
};
