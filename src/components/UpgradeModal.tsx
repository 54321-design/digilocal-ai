import React, { useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Phone,
  MessageSquare,
  KeyRound,
  Check,
} from 'lucide-react-native';
import { useAdmin } from '../context/AdminContext';
import { ClientQuotaService, UPGRADE_PROMPT_MESSAGE } from '../services/quota/quotaService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureTitle?: string;
  customMessage?: string;
  onUnlocked?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  featureTitle = 'AI Generation & SEO Fetch',
  customMessage = UPGRADE_PROMPT_MESSAGE,
  onUnlocked,
}) => {
  const { unlockAdmin, isAdmin } = useAdmin();
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlockWithPin = async () => {
    if (!pinCode.trim()) {
      setPinError('Please enter admin PIN');
      return;
    }

    setIsUnlocking(true);
    setPinError('');
    try {
      const success = await unlockAdmin(pinCode.trim());
      if (success) {
        await ClientQuotaService.upgradePlan('admin');
        Alert.alert('Unlocked!', 'Master Admin access enabled. All API limits removed.');
        setShowPinInput(false);
        setPinCode('');
        onClose();
        if (onUnlocked) onUnlocked();
      } else {
        setPinError('Invalid passcode. Access denied.');
      }
    } catch {
      setPinError('Verification error. Try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      'Hello DigiBirds 360°, I would like to upgrade my DigiLocal AI plan for unlimited post generation and SEO audits.'
    );
    Linking.openURL(`whatsapp://send?phone=+918826273360&text=${text}`).catch(() => {
      Linking.openURL(`https://wa.me/918826273360?text=${text}`).catch(() => {
        Alert.alert('Support', 'Please contact DigiBirds 360° at support@digibirds360.com or +91 88262 73360');
      });
    });
  };

  const handleContactCall = () => {
    Linking.openURL('tel:+918826273360').catch(() => {
      Alert.alert('Support Phone', '+91 88262 73360');
    });
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end md:justify-center items-center">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl max-h-[92%] overflow-hidden shadow-2xl border border-slate-100"
        >
          {/* Header Banner */}
          <View className="bg-slate-900 px-6 pt-6 pb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="p-2 bg-amber-500/20 rounded-xl mr-2.5 border border-amber-500/30">
                  <Crown size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    DigiBirds 360° Pro
                  </Text>
                  <Text className="text-base font-extrabold text-white">
                    Free Trial Limit Reached
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                className="p-1.5 rounded-full bg-slate-800 border border-slate-700 active:bg-slate-700"
              >
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Prominent Upgrade Banner */}
            <View className="bg-amber-500/15 border border-amber-400/40 rounded-xl p-3 flex-row items-center">
              <Lock size={18} color="#f59e0b" className="mr-2.5" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-bold text-amber-200">
                  {customMessage}
                </Text>
                <Text className="text-[11px] text-slate-300 mt-0.5">
                  1 free test credit used for {featureTitle}.
                </Text>
              </View>
            </View>
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Why Upgrade Section */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Plan Benefits
            </Text>

            <View className="space-y-2 mb-4">
              <View className="flex-row items-center py-1">
                <View className="p-1 bg-emerald-50 rounded-full mr-2.5">
                  <CheckCircle2 size={16} color="#10b981" />
                </View>
                <Text className="text-xs font-medium text-slate-700 flex-1">
                  Unlimited Festival & Marketing Post Designs
                </Text>
              </View>

              <View className="flex-row items-center py-1">
                <View className="p-1 bg-emerald-50 rounded-full mr-2.5">
                  <CheckCircle2 size={16} color="#10b981" />
                </View>
                <Text className="text-xs font-medium text-slate-700 flex-1">
                  Automated Customer Review Responses (Hindi, English, Hinglish)
                </Text>
              </View>

              <View className="flex-row items-center py-1">
                <View className="p-1 bg-emerald-50 rounded-full mr-2.5">
                  <CheckCircle2 size={16} color="#10b981" />
                </View>
                <Text className="text-xs font-medium text-slate-700 flex-1">
                  Technical Domain & Website SEO Audits
                </Text>
              </View>

              <View className="flex-row items-center py-1">
                <View className="p-1 bg-emerald-50 rounded-full mr-2.5">
                  <CheckCircle2 size={16} color="#10b981" />
                </View>
                <Text className="text-xs font-medium text-slate-700 flex-1">
                  Multi-Channel Social & Google Business Scheduling
                </Text>
              </View>
            </View>

            {/* Pricing Packages Box */}
            <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm font-bold text-slate-900">
                  DigiLocal Growth Autopilot
                </Text>
                <View className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-extrabold text-indigo-700">POPULAR</Text>
                </View>
              </View>
              <Text className="text-xl font-extrabold text-slate-900 mb-1">
                ₹999 <Text className="text-xs font-normal text-slate-500">/ month</Text>
              </Text>
              <Text className="text-xs text-slate-600">
                Ideal for growing single & multi-store local businesses looking to dominate local search.
              </Text>
            </View>

            {/* Upgrade CTA Buttons */}
            <Pressable
              onPress={handleContactWhatsApp}
              className="bg-emerald-600 active:bg-emerald-700 py-3.5 px-4 rounded-xl flex-row items-center justify-center shadow-sm mb-2.5"
            >
              <MessageSquare size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white ml-2">
                Upgrade via WhatsApp (+91 88262 73360)
              </Text>
            </Pressable>

            <Pressable
              onPress={handleContactCall}
              className="bg-slate-100 active:bg-slate-200 py-3 px-4 rounded-xl flex-row items-center justify-center border border-slate-200 mb-4"
            >
              <Phone size={16} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700 ml-2">
                Speak with Sales / Agency Support (+91 88262 73360)
              </Text>
            </Pressable>

            {/* Agency Admin Access (Discreet, secure, password completely hidden) */}
            <View className="pt-2 border-t border-slate-100">
              {!showPinInput ? (
                <Pressable
                  onPress={() => setShowPinInput(true)}
                  className="flex-row items-center justify-center py-2 opacity-60 active:opacity-100"
                >
                  <KeyRound size={12} color="#94a3b8" />
                  <Text className="text-[11px] font-medium text-slate-400 ml-1.5">
                    Agency Administrator Sign In
                  </Text>
                </Pressable>
              ) : (
                <View className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Text className="text-xs font-bold text-slate-700 mb-1.5">
                    Agency Passcode
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      value={pinCode}
                      onChangeText={(t) => {
                        setPinCode(t);
                        setPinError('');
                      }}
                      placeholder="Enter administrative PIN"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      secureTextEntry
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
                    />
                    <Pressable
                      onPress={handleUnlockWithPin}
                      disabled={isUnlocking}
                      className="bg-slate-900 active:bg-slate-800 px-4 py-2.5 rounded-lg"
                    >
                      <Text className="text-xs font-bold text-white">
                        {isUnlocking ? '...' : 'Verify'}
                      </Text>
                    </Pressable>
                  </View>
                  {pinError ? (
                    <Text className="text-[11px] text-rose-600 mt-1.5 font-medium">{pinError}</Text>
                  ) : (
                    <Text className="text-[10px] text-slate-400 mt-1">
                      Authorized DigiBirds agency administrators only.
                    </Text>
                  )}
                </View>
              )}
            </View>

            <Pressable onPress={onClose} className="py-3 items-center mt-2">
              <Text className="text-xs font-medium text-slate-400">Cancel & return to screen</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};
