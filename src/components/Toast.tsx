import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  className = '',
}) => {
  if (!visible) return null;

  const bgStyles = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    warning: 'bg-amber-600',
    info: 'bg-slate-900',
  }[type];

  const icon = {
    success: <CheckCircle2 size={16} color="#ffffff" />,
    error: <XCircle size={16} color="#ffffff" />,
    warning: <AlertCircle size={16} color="#ffffff" />,
    info: <Info size={16} color="#ffffff" />,
  }[type];

  return (
    <View
      className={`absolute bottom-6 left-4 right-4 z-50 flex-row items-center px-4 py-3 rounded-2xl shadow-lg ${bgStyles} ${className}`}
    >
      <View className="mr-2.5">{icon}</View>
      <Text className="flex-1 text-xs font-semibold text-white">{message}</Text>
    </View>
  );
};
