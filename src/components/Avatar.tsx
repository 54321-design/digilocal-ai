import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 rounded-full',
    md: 'w-10 h-10 rounded-full',
    lg: 'w-14 h-14 rounded-full',
  }[size];

  const textStyles = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
  }[size];

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        className={`${sizeStyles} bg-slate-200 ${className}`}
      />
    );
  }

  return (
    <View
      className={`items-center justify-center bg-blue-100 border border-blue-200 ${sizeStyles} ${className}`}
    >
      <Text className={`text-blue-800 ${textStyles}`}>{initials}</Text>
    </View>
  );
};
