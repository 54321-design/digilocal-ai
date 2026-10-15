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
import { useQuota } from '../context/QuotaContext';
import { Card, Button, Badge, LoadingState, EmptyState, ErrorState } from '../components';

export const AIScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const { plan, generatePlan, isLoading, error } = useCopilot();
  const { runWithQuota } = useQuota();

  const handleGeneratePlan = async () => {
    await runWithQuota(
      'copilot_plan',
      'AI Growth Copilot Action Plan',
      async () => {
        await generatePlan();
      }
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Copilot Header Card */}
      <Card className="p-5 bg-white border border-slate-200 shadow-xs mb-4">
        <View className="flex-row items-center mb-2">
          <View className="p-2 bg-blue-50 rounded-xl mr-3">
            <TrendingUp size={20} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">
              Growth Strategy & Action Plan
            </Text>
            <Text className="text-xs text-slate-500 font-medium">
              Automated listing optimization & review insights
            </Text>
          </View>
        </View>

        <Text className="text-xs text-slate-600 leading-relaxed mb-4">
          Evaluates your verified Google Business Profile parameters and customer sentiment to
          generate an evidence-based roadmap for local search visibility.
        </Text>

        <Button
          title={plan ? 'Refresh Strategy Plan' : 'Generate Action Plan'}
          onPress={handleGeneratePlan}
          loading={isLoading}
          variant="primary"
          icon={<TrendingUp size={16} color="#ffffff" />}
        />
      </Card>

      {error && <ErrorState message={error} onRetry={handleGeneratePlan} />}

      {isLoading ? (
        <LoadingState message="Analyzing listing performance and compiling strategy roadmap..." />
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
          icon={<TrendingUp size={32} color="#2563eb" />}
          title="No Strategy Plan Yet"
          description="Generate a prioritized action roadmap tailored to your Google Business Profile and local search visibility."
          actionTitle="Generate Plan"
          onAction={handleGeneratePlan}
        />
      )}
    </ScrollView>
  );
};
