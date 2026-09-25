import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Globe,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Zap,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react-native';
import { useSEO } from '../context/SEOContext';
import { useGoogle } from '../context/GoogleContext';
import { Card, Badge, Button, MetricCard, LoadingState } from '../components';

export const WebAuditScreen: React.FC = () => {
  const { selectedLocation } = useGoogle();
  const {
    audit,
    runAudit,
    isLoadingAudit,
    webAudit,
    runWebAudit,
    isLoadingWebAudit,
    domainData,
    analyzeDomain,
    isResearching,
  } = useSEO();

  const [activeTab, setActiveTab] = useState<'audit' | 'semrush'>('audit');
  const [websiteUrl, setWebsiteUrl] = useState(
    selectedLocation?.websiteUri || 'https://digilocal.ai'
  );
  const [domainQuery, setDomainQuery] = useState('digilocal.ai');

  useEffect(() => {
    if (!webAudit) {
      runWebAudit(websiteUrl);
    }
  }, []);

  const handleStartAudit = async () => {
    if (!websiteUrl.trim()) {
      Alert.alert('URL Required', 'Please enter a valid website URL to scan.');
      return;
    }
    await runWebAudit(websiteUrl.trim());
    runAudit();
  };

  const handleSearchDomain = async () => {
    if (!domainQuery.trim()) return;
    await analyzeDomain(domainQuery.trim());
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Top Header & URL bar */}
      <View className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Website & Local 3-Pack Audit
        </Text>
        <View className="flex-row items-center space-x-2">
          <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
            <Globe size={16} color="#64748b" className="mr-2" />
            <TextInput
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://yourstore.com"
              className="flex-1 text-xs text-slate-900"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <Button
            title={isLoadingWebAudit ? 'Auditing...' : 'Run Audit'}
            onPress={handleStartAudit}
            size="sm"
            variant="primary"
            disabled={isLoadingWebAudit}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row space-x-2 mb-4 bg-slate-200/70 p-1 rounded-xl">
        <Pressable
          onPress={() => setActiveTab('audit')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'audit' ? 'bg-white shadow-xs' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'audit' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Site & GMB Health Audit
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('semrush')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'semrush' ? 'bg-white shadow-xs' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'semrush' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            SEMrush Domain Analytics
          </Text>
        </Pressable>
      </View>

      {activeTab === 'audit' ? (
        isLoadingWebAudit ? (
          <LoadingState message="Analyzing website performance, Schema.org markup, and Google Maps NAP consistency..." />
        ) : webAudit ? (
          <View>
            {/* Score Overview Card */}
            <Card className="bg-white border-blue-100 mb-4 p-4">
              <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <View>
                  <Text className="text-xs font-semibold text-slate-500">Overall Health Score</Text>
                  <Text className="text-3xl font-extrabold text-blue-600">
                    {webAudit.overallScore}/100
                  </Text>
                </View>
                <Badge
                  label={webAudit.overallScore >= 80 ? 'Grade A (Excellent)' : 'Needs Improvement'}
                  variant={webAudit.overallScore >= 80 ? 'success' : 'warning'}
                  size="md"
                />
              </View>

              {/* Sub Scores */}
              <View className="flex-row space-x-2">
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <Zap size={16} color="#2563eb" className="mb-1" />
                  <Text className="text-[10px] text-slate-500 font-bold">Speed</Text>
                  <Text className="text-xs font-extrabold text-slate-800">{webAudit.performanceScore}%</Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <TrendingUp size={16} color="#10b981" className="mb-1" />
                  <Text className="text-[10px] text-slate-500 font-bold">SEO</Text>
                  <Text className="text-xs font-extrabold text-slate-800">{webAudit.seoScore}%</Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <Smartphone size={16} color="#8b5cf6" className="mb-1" />
                  <Text className="text-[10px] text-slate-500 font-bold">Mobile</Text>
                  <Text className="text-xs font-extrabold text-slate-800">{webAudit.mobileScore}%</Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <ShieldCheck size={16} color="#059669" className="mb-1" />
                  <Text className="text-[10px] text-slate-500 font-bold">Security</Text>
                  <Text className="text-xs font-extrabold text-slate-800">{webAudit.securityScore}%</Text>
                </View>
              </View>
            </Card>

            {/* Audit Checks Checklist */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Detailed Audit Factors ({webAudit.checks.length})
            </Text>

            {webAudit.checks.map((check) => (
              <Card key={check.id} className="mb-3 bg-white border-slate-200/90 shadow-xs">
                <View className="flex-row items-start justify-between mb-1.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    {check.status === 'pass' ? (
                      <CheckCircle size={18} color="#10b981" className="mr-2" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle size={18} color="#f59e0b" className="mr-2" />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" className="mr-2" />
                    )}
                    <Text className="text-sm font-bold text-slate-900 flex-1">{check.title}</Text>
                  </View>
                  <Badge
                    label={check.category}
                    variant={check.category === 'GMB 3-Pack' ? 'primary' : 'neutral'}
                    size="sm"
                  />
                </View>

                <Text className="text-xs text-slate-600 mb-2 pl-6 leading-relaxed">
                  {check.detail}
                </Text>

                <View className="bg-slate-50 p-2 rounded-xl border border-slate-100 ml-6">
                  <Text className="text-[11px] font-semibold text-blue-900">
                    💡 Recommended Fix: {check.fixAction}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : null
      ) : (
        /* SEMrush Domain Research Tab */
        <View>
          <Card className="bg-white border-slate-200 mb-4">
            <Text className="text-xs font-bold text-slate-800 mb-1.5">Search Domain Authority</Text>
            <View className="flex-row space-x-2">
              <TextInput
                value={domainQuery}
                onChangeText={setDomainQuery}
                placeholder="domain.com"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <Button
                title={isResearching ? 'Searching...' : 'Search'}
                onPress={handleSearchDomain}
                size="sm"
                variant="primary"
                disabled={isResearching}
              />
            </View>
          </Card>

          {isResearching ? (
            <LoadingState message="Fetching live SEMrush search volume and organic rank data..." />
          ) : domainData ? (
            <Card className="bg-white border-blue-100">
              <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <Text className="text-sm font-bold text-slate-900">{domainData.domain}</Text>
                <Badge label="SEMrush Verified" variant="primary" size="sm" />
              </View>

              <View className="flex-row space-x-2 mb-3">
                <MetricCard
                  title="Organic Keywords"
                  value={domainData.organicKeywords.toLocaleString()}
                  icon={<Search size={16} color="#2563eb" />}
                />
                <MetricCard
                  title="Monthly Traffic"
                  value={domainData.organicTraffic.toLocaleString()}
                  icon={<TrendingUp size={16} color="#10b981" />}
                />
              </View>

              <View className="flex-row space-x-2">
                <MetricCard
                  title="Traffic Cost"
                  value={`$${domainData.organicCost.toLocaleString()}`}
                  icon={<Zap size={16} color="#f59e0b" />}
                />
                <MetricCard
                  title="Database Market"
                  value="IN (India)"
                  icon={<Globe size={16} color="#6366f1" />}
                />
              </View>
            </Card>
          ) : (
            <Card className="bg-white border-slate-200 items-center py-6">
              <Search size={32} color="#94a3b8" className="mb-2" />
              <Text className="text-xs text-slate-500">
                Enter your domain above to inspect organic search ranking keywords.
              </Text>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
};
