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

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className={`w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl border border-slate-100 ${className}`}
            >
              <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-slate-100">
                {title ? (
                  <Text className="text-base font-bold text-slate-900">{title}</Text>
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
