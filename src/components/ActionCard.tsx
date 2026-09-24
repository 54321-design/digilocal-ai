import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card } from './Card';

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  actionText?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onPress,
  actionText,
  priority = 'medium',
  className = '',
}) => {
  const priorityColor = {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-slate-400',
  }[priority];

  return (
    <Card onPress={onPress} className={`mb-3 p-4 border border-slate-200 ${className}`}>
      <View className="flex-row items-start">
        <View className={`w-1.5 h-full rounded-full mr-3 ${priorityColor}`} />
        {icon && <View className="mr-3 mt-0.5">{icon}</View>}
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900 mb-1">{title}</Text>
          <Text className="text-xs text-slate-600 leading-relaxed">{description}</Text>
          {actionText && (
            <View className="flex-row items-center mt-2.5">
              <Text className="text-xs font-semibold text-blue-600 mr-1">{actionText}</Text>
              <ChevronRight size={14} color="#2563eb" />
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};
