import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value?: string | number | null;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  unavailableMessage?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  unavailableMessage = 'Data unavailable',
  className = '',
}) => {
  const isAvailable = value !== undefined && value !== null && value !== '';

  return (
    <Card className={`p-4 flex-1 min-w-[140px] ${className}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </Text>
        {icon && <View className="p-1.5 bg-slate-50 rounded-lg">{icon}</View>}
      </View>

      {isAvailable ? (
        <View>
          <Text className="text-2xl font-bold text-slate-900">{value}</Text>
          {subtitle && (
            <Text className="text-xs text-slate-500 mt-1">{subtitle}</Text>
          )}
          {trend && (
            <View className="flex-row items-center mt-1.5">
              <Text
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </Text>
              <Text className="text-[11px] text-slate-400 ml-1">vs last period</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="py-1">
          <Text className="text-sm font-medium text-slate-400 italic">
            {unavailableMessage}
          </Text>
          {subtitle && (
            <Text className="text-[11px] text-slate-400 mt-1">{subtitle}</Text>
          )}
        </View>
      )}
    </Card>
  );
};
