import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Globe,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import { useSEO } from '../context/SEOContext';
import { useGoogle } from '../context/GoogleContext';
import { useQuota } from '../context/QuotaContext';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../components';

export const SEOScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const {
    audit,
    runAudit,
    isLoadingAudit,
    domainData,
    competitorData,
    keywordData,
    isResearching,
    researchError,
    analyzeDomain,
    researchKeyword,
  } = useSEO();
  const { runWithQuota } = useQuota();

  const [activeTab, setActiveTab] = useState<'audit' | 'competitor' | 'keywords'>('audit');
  const [domainInput, setDomainInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const handleLookupDomain = async () => {
    if (!domainInput.trim()) return;
    await runWithQuota(
      'seo_audit',
      'Domain & Backlink SEO Analysis',
      async () => {
        await analyzeDomain(domainInput.trim());
      }
    );
  };

  const handleLookupKeyword = async () => {
    if (!keywordInput.trim()) return;
    await runWithQuota(
      'seo_audit',
      'Keyword Volume & Ranking Analysis',
      async () => {
        await researchKeyword(keywordInput.trim());
      }
    );
  };

  const statusIcon = {
    pass: <CheckCircle2 size={16} color="#10b981" />,
    warning: <AlertTriangle size={16} color="#f59e0b" />,
    fail: <XCircle size={16} color="#ef4444" />,
  };

  const priorityBadge = {
    critical: <Badge label="Critical" variant="danger" size="sm" />,
    high: <Badge label="High Priority" variant="warning" size="sm" />,
    medium: <Badge label="Medium" variant="primary" size="sm" />,
    low: <Badge label="Low" variant="neutral" size="sm" />,
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Sub-navigation tabs */}
      <View className="flex-row bg-white px-4 pt-3 pb-2 border-b border-slate-100">
        <Pressable
          onPress={() => setActiveTab('audit')}
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'audit' ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'audit' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Profile Audit
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('competitor')}
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'competitor' ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'competitor' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Organic Research
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('keywords')}
          className={`flex-1 py-2 items-center border-b-2 ${
            activeTab === 'keywords' ? 'border-blue-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'keywords' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            Keyword Volume
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'audit' ? (
          <View>
            {/* Location context header */}
            <View className="bg-white p-4 rounded-2xl border border-slate-200 mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Location Audited
                </Text>
                <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                  {selectedLocation?.title || 'No Location Selected'}
                </Text>
              </View>
              <Button
                title="Re-run Audit"
                onPress={runAudit}
                loading={isLoadingAudit}
                size="sm"
                variant="outline"
              />
            </View>

            {/* Audit Summary Card */}
            {audit ? (
              <View className="mb-4">
                <Card className="p-4 bg-white border border-slate-200 mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Audit Health Summary
                    </Text>
                    <Badge
                      label={`${audit.passedCount} of ${audit.totalChecks} Passed`}
                      variant={
                        audit.passedCount === audit.totalChecks
                          ? 'success'
                          : audit.passedCount >= audit.totalChecks / 2
                          ? 'warning'
                          : 'danger'
                      }
                    />
                  </View>
                  <Text className="text-xs text-slate-600 leading-relaxed">
                    Verified through the official Google Business Information API. Each check
                    represents a direct ranking factor for Google Maps Local Pack discovery.
                  </Text>
                </Card>

                {/* Individual Evidence-Based Checks */}
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Evidence-Based Audit Items
                </Text>

                {audit.checks.map((check) => (
                  <Card key={check.id} className="mb-3 p-4 bg-white border border-slate-200">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center flex-1 mr-2">
                        {statusIcon[check.status]}
                        <Text className="text-sm font-bold text-slate-900 ml-2">
                          {check.title}
                        </Text>
                      </View>
                      {priorityBadge[check.priority]}
                    </View>

                    <View className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                      <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Observed Evidence:
                      </Text>
                      <Text className="text-xs text-slate-800">{check.evidence}</Text>
                    </View>

                    <View className="mt-1">
                      <Text className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">
                        Recommended Action:
                      </Text>
                      <Text className="text-xs text-slate-700 leading-relaxed">
                        {check.action}
                      </Text>
                    </View>

                    <Text className="text-[10px] text-slate-400 mt-2 italic text-right">
                      Source: {check.source}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<ShieldCheck size={32} color="#2563eb" />}
                title="Run Live SEO Audit"
                description="Evaluate your Google profile completeness, contact details, categories, and review engagement."
                actionTitle="Run Audit"
                onAction={runAudit}
              />
            )}
          </View>
        ) : activeTab === 'competitor' ? (
          <View>
            <Card className="p-4 bg-white border border-slate-200 mb-4">
              <Text className="text-sm font-bold text-slate-900 mb-1">
                Domain Organic Traffic Research
              </Text>
              <Text className="text-xs text-slate-500 mb-3">
                Research live organic search rankings and keyword traffic via the SEMrush SEO database.
              </Text>

              <View className="flex-row items-center border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 mb-3">
                <Globe size={16} color="#64748b" className="mr-2" />
                <TextInput
                  value={domainInput}
                  onChangeText={setDomainInput}
                  placeholder="e.g. yourbusiness.com"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-xs text-slate-900"
                  autoCapitalize="none"
                />
              </View>

              <Button
                title="Lookup Domain Rank"
                onPress={handleLookupDomain}
                loading={isResearching}
                size="sm"
                variant="primary"
              />
            </Card>

            {researchError && <ErrorState message={researchError} />}

            {domainData && (
              <Card className="p-4 bg-white border border-slate-200 mb-4">
                <Text className="text-sm font-bold text-slate-900 mb-3">
                  SEMrush Results for: {domainData.domain}
                </Text>
                <View className="flex-row justify-between mb-2">
                  <View className="p-3 bg-slate-50 rounded-xl flex-1 mr-2">
                    <Text className="text-[10px] text-slate-400 uppercase font-bold">
                      Organic Keywords
                    </Text>
                    <Text className="text-lg font-bold text-slate-900">
                      {domainData.organicKeywords}
                    </Text>
                  </View>
                  <View className="p-3 bg-slate-50 rounded-xl flex-1">
                    <Text className="text-[10px] text-slate-400 uppercase font-bold">
                      Organic Traffic
                    </Text>
                    <Text className="text-lg font-bold text-blue-600">
                      {domainData.organicTraffic} /mo
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] text-slate-400 mt-2 text-right">
                  Source: SEMrush Database (IN)
                </Text>
              </Card>
            )}
          </View>
        ) : (
          <View>
            <Card className="p-4 bg-white border border-slate-200 mb-4">
              <Text className="text-sm font-bold text-slate-900 mb-1">
                Local Keyword Search Volume
              </Text>
              <Text className="text-xs text-slate-500 mb-3">
                Check monthly search volume and CPC competition for high-intent local customer searches.
              </Text>

              <View className="flex-row items-center border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 mb-3">
                <Search size={16} color="#64748b" className="mr-2" />
                <TextInput
                  value={keywordInput}
                  onChangeText={setKeywordInput}
                  placeholder="e.g. coffee shop near me"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-xs text-slate-900"
                  autoCapitalize="none"
                />
              </View>

              <Button
                title="Check Keyword Volume"
                onPress={handleLookupKeyword}
                loading={isResearching}
                size="sm"
                variant="primary"
              />
            </Card>

            {researchError && <ErrorState message={researchError} />}

            {keywordData && (
              <Card className="p-4 bg-white border border-slate-200">
                <Text className="text-sm font-bold text-slate-900 mb-3">
                  Keyword: "{keywordData.keyword}"
                </Text>
                <View className="flex-row justify-between mb-2">
                  <View className="p-3 bg-slate-50 rounded-xl flex-1 mr-2">
                    <Text className="text-[10px] text-slate-400 uppercase font-bold">
                      Monthly Volume
                    </Text>
                    <Text className="text-lg font-bold text-slate-900">
                      {keywordData.volume} searches
                    </Text>
                  </View>
                  <View className="p-3 bg-slate-50 rounded-xl flex-1">
                    <Text className="text-[10px] text-slate-400 uppercase font-bold">
                      CPC Cost
                    </Text>
                    <Text className="text-lg font-bold text-emerald-600">
                      ${keywordData.cpc}
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] text-slate-400 mt-2 text-right">
                  Competition: {keywordData.competition} | Source: SEMrush Database
                </Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
