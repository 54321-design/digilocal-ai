import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  className = '',
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className={`w-full bg-white rounded-t-3xl p-6 shadow-2xl max-h-[85%] border-t border-slate-100 ${className}`}
            >
              {/* Drag Indicator handle */}
              <View className="items-center mb-3">
                <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </View>

              <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-slate-100">
                {title ? (
                  <Text className="text-lg font-bold text-slate-900">{title}</Text>
                ) : (
                  <View />
                )}
                <Pressable onPress={onClose} className="p-1.5 rounded-full bg-slate-100">
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              {children}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
