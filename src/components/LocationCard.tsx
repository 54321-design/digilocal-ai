import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MapPin, Phone, Globe, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { GoogleLocation } from '../types';

interface LocationCardProps {
  location: GoogleLocation;
  isSelected?: boolean;
  onPress?: () => void;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected = false,
  onPress,
  className = '',
}) => {
  const address = location.storefrontAddress?.addressLines?.join(', ') || 'Address not configured';
  const category = location.categories?.primaryCategory?.displayName || 'Local Business';
  const phone = location.phoneNumbers?.primaryPhone;

  return (
    <Card
      onPress={onPress}
      className={`mb-3 p-4 ${
        isSelected ? 'border-2 border-blue-600 bg-blue-50/20' : 'border border-slate-200'
      } ${className}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
              {location.title}
            </Text>
            {isSelected && (
              <Badge label="Active" variant="primary" size="sm" className="ml-2" />
            )}
          </View>
          <Text className="text-xs font-semibold text-blue-600 mb-2">{category}</Text>

          <View className="flex-row items-center mb-1">
            <MapPin size={13} color="#64748b" className="mr-1.5" />
            <Text className="text-xs text-slate-600 flex-1" numberOfLines={2}>
              {address}
            </Text>
          </View>

          {phone ? (
            <View className="flex-row items-center mb-1">
              <Phone size={13} color="#64748b" className="mr-1.5" />
              <Text className="text-xs text-slate-600">{phone}</Text>
            </View>
          ) : null}

          {location.websiteUri ? (
            <View className="flex-row items-center">
              <Globe size={13} color="#64748b" className="mr-1.5" />
              <Text className="text-xs text-blue-600" numberOfLines={1}>
                {location.websiteUri}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="items-center justify-center pl-2">
          <ChevronRight size={20} color="#94a3b8" />
        </View>
      </View>
    </Card>
  );
};
