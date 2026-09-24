import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  className = '',
}) => {
  return (
    <View
      className={`flex-row items-center bg-slate-100/90 rounded-xl px-3 py-2 border border-slate-200/60 ${className}`}
    >
      <Search size={18} color="#64748b" className="mr-2" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="flex-1 text-sm text-slate-800 py-0.5"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          className="p-1"
        >
          <X size={16} color="#64748b" />
        </Pressable>
      )}
    </View>
  );
};
