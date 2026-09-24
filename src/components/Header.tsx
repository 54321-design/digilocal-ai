import React from 'react';
import { View, Text } from 'react-native';
import { IconButton } from './IconButton';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  className = '',
}) => {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100 ${className}`}
    >
      <View className="flex-row items-center flex-1">
        {leftAction && (
          <View className="mr-2">
            <IconButton icon={leftAction.icon} onPress={leftAction.onPress} size="sm" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-slate-500" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && (
        <IconButton icon={rightAction.icon} onPress={rightAction.onPress} size="sm" />
      )}
    </View>
  );
};
