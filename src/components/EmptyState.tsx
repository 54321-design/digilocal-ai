import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  className = '',
}) => {
  return (
    <View className={`items-center justify-center py-10 px-6 ${className}`}>
      {icon && <View className="p-4 bg-slate-100 rounded-2xl mb-4">{icon}</View>}
      <Text className="text-base font-bold text-slate-800 text-center mb-1.5">{title}</Text>
      <Text className="text-xs text-slate-500 text-center leading-relaxed mb-5 max-w-xs">
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} size="sm" variant="primary" />
      )}
    </View>
  );
};
