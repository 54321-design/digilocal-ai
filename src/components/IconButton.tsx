import React from 'react';
import { Pressable, View } from 'react-native';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const variantClasses = {
    primary: 'bg-blue-600 active:bg-blue-700',
    secondary: 'bg-slate-800 active:bg-slate-900',
    outline: 'border border-slate-300 bg-white active:bg-slate-50',
    ghost: 'bg-transparent active:bg-slate-100',
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center ${sizeClasses} ${variantClasses} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      <View>{icon}</View>
    </Pressable>
  );
};
