import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <View className={`items-center justify-center p-6 bg-red-50/50 rounded-2xl border border-red-100 my-4 ${className}`}>
      <View className="p-3 bg-red-100 rounded-full mb-3">
        <AlertTriangle size={24} color="#dc2626" />
      </View>
      <Text className="text-sm font-bold text-red-900 text-center mb-1">{title}</Text>
      <Text className="text-xs text-red-700 text-center leading-relaxed mb-4">{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          size="sm"
          className="bg-white border-red-200"
        />
      )}
    </View>
  );
};
