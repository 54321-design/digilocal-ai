import React from 'react';
import { View, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  className = '',
  variant = 'outlined',
}) => {
  const variantStyles = {
    elevated: 'bg-white shadow-sm shadow-slate-200 border border-slate-100',
    outlined: 'bg-white border border-slate-200',
    flat: 'bg-slate-50',
  }[variant];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`rounded-2xl p-4 active:opacity-90 ${variantStyles} ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={`rounded-2xl p-4 ${variantStyles} ${className}`}>
      {children}
    </View>
  );
};
