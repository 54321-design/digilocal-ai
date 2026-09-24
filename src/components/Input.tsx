import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`w-full mb-3 ${containerClassName}`}>
      {label && <Text className="text-xs font-semibold text-slate-700 mb-1.5">{label}</Text>}
      <View
        className={`flex-row items-center border rounded-xl bg-white px-3 py-2.5 ${
          error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
        }`}
      >
        {leftIcon && <View className="mr-2 text-slate-400">{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#94a3b8"
          className={`flex-1 text-sm text-slate-900 ${className}`}
          {...props}
        />
        {rightIcon && <View className="ml-2 text-slate-400">{rightIcon}</View>}
      </View>
      {error ? (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
};
