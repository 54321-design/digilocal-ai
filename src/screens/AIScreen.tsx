import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Share2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react-native';
import { useCopilot } from '../context/CopilotContext';
import { useGoogle } from '../context/GoogleContext';
import { Card, Button, Badge, LoadingState, EmptyState, ErrorState } from '../components';

export const AIScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const { plan, generatePlan, isLoading, error } = useCopilot();

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Copilot Header Card */}
      <Card className="p-5 bg-white border border-indigo-100 shadow-sm mb-4">
        <View className="flex-row items-center mb-2">
          <View className="p-2 bg-indigo-50 rounded-xl mr-3">
            <Sparkles size={20} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-slate-900">
              DigiLocal Growth Copilot
            </Text>
            <Text className="text-xs text-indigo-600 font-semibold">
              AI Powered by Gemini 2.5 Flash
            </Text>
          </View>
        </View>

        <Text className="text-xs text-slate-600 leading-relaxed mb-4">
          Analyzes your official Google Business Profile parameters and customer sentiment to
          generate a custom, evidence-based roadmap for local growth.
        </Text>

        <Button
          title={plan ? 'Re-generate Growth Plan' : 'Generate Weekly Action Plan'}
          onPress={generatePlan}
          loading={isLoading}
          variant="primary"
          icon={<Sparkles size={16} color="#ffffff" />}
        />
      </Card>

      {error && <ErrorState message={error} onRetry={generatePlan} />}

      {isLoading ? (
        <LoadingState message="Copilot is analyzing profile health and generating your roadmap..." />
      ) : plan ? (
        <View>
          {/* Executive Summary */}
          <Card className="p-4 bg-white border border-slate-200 mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Profile Diagnostic Summary
            </Text>
            <Text className="text-sm font-medium text-slate-800 leading-relaxed">
              {plan.summary}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-2 text-right">
              Generated: {new Date(plan.generatedAt).toLocaleDateString()}
            </Text>
          </Card>

          {/* Weekly Action Plan */}
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Weekly Priority Action Items
          </Text>
          <Card className="p-4 bg-white border border-slate-200 mb-4">
            {plan.actionPlan.map((action, idx) => (
              <View key={idx} className="flex-row items-start mb-3 last:mb-0">
                <View className="w-5 h-5 rounded-full bg-blue-100 items-center justify-center mr-2.5 mt-0.5">
                  <Text className="text-xs font-bold text-blue-700">{idx + 1}</Text>
                </View>
                <Text className="text-xs text-slate-800 flex-1 leading-relaxed">
                  {action}
                </Text>
              </View>
            ))}
          </Card>

          {/* Local SEO Suggestions */}
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Local Pack SEO Optimizations
          </Text>
          <Card className="p-4 bg-white border border-slate-200 mb-4">
            {plan.seoInsights.map((insight, idx) => (
              <View key={idx} className="flex-row items-start mb-2.5 last:mb-0">
                <CheckCircle2 size={16} color="#10b981" className="mr-2 mt-0.5" />
                <Text className="text-xs text-slate-700 flex-1 leading-relaxed">
                  {insight}
                </Text>
              </View>
            ))}
          </Card>

          {/* Google Business Post Ideas */}
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Google Business Post Ideas
          </Text>
          {plan.postIdeas.map((post, idx) => (
            <Card key={idx} className="p-4 bg-white border border-slate-200 mb-3">
              <View className="flex-row items-center mb-1.5">
                <Share2 size={14} color="#6366f1" className="mr-2" />
                <Text className="text-xs font-bold text-slate-900">
                  Update Idea #{idx + 1}
                </Text>
              </View>
              <Text className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{post}"
              </Text>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon={<Sparkles size={32} color="#6366f1" />}
          title="No Plan Generated Yet"
          description="Tap the button above to have DigiLocal's Copilot formulate recommendations based on your actual Google location."
          actionTitle="Generate Plan"
          onAction={generatePlan}
        />
      )}
    </ScrollView>
  );
};
