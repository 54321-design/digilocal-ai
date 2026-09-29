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
  const { locations, selectedLocation, selectLocation, isSyncingLocation } = useGoogle();
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

  const [activeTab, setActiveTab] = useState<'gmb_audit' | 'web_audit' | 'semrush'>('gmb_audit');
  const [websiteUrl, setWebsiteUrl] = useState(selectedLocation?.websiteUri || '');
  const [domainQuery, setDomainQuery] = useState('');

  useEffect(() => {
    const locUrl = selectedLocation?.websiteUri || '';
    setWebsiteUrl(locUrl);
    if (locUrl) {
      const cleanedHost = locUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      setDomainQuery(cleanedHost);
    } else {
      setDomainQuery('');
    }
  }, [selectedLocation?.id, selectedLocation?.websiteUri]);

  const handleStartAudit = async () => {
    runAudit();
    if (websiteUrl.trim()) {
      await runWebAudit(websiteUrl.trim());
      setActiveTab('web_audit');
    } else {
      Alert.alert(
        'No Website URL',
        'This GMB location does not have a website URL linked yet. Enter a URL above to scan a website.'
      );
    }
  };

  const handleSearchDomain = async () => {
    if (!domainQuery.trim()) {
      Alert.alert('Domain Required', 'Enter a domain name (e.g. yourbusiness.com) to analyze.');
      return;
    }
    await analyzeDomain(domainQuery.trim());
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Active Location Selector */}
      {locations.length > 0 && (
        <View className="bg-white p-3.5 rounded-2xl border border-slate-200 mb-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Auditing GMB Location ({locations.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {locations.map((loc) => {
              const active = selectedLocation?.id === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => selectLocation(loc.id)}
                  style={{
                    backgroundColor: active ? '#131A38' : '#F8FAFC',
                    borderColor: active ? '#131A38' : '#E2E8F0',
                    borderWidth: 1,
                  }}
                  className="mr-2 px-3.5 py-2 rounded-xl"
                >
                  <Text
                    style={{ color: active ? '#FFFFFF' : '#1E293B' }}
                    className="text-xs font-semibold"
                    numberOfLines={1}
                  >
                    {loc.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {isSyncingLocation && (
            <Text className="text-[11px] text-blue-600 mt-2">
              Fetching live Google data for {selectedLocation?.title}...
            </Text>
          )}
        </View>
      )}

      {/* Top Header & URL bar */}
      <View className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Website & Local 3-Pack Audit
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
            <Globe size={16} color="#64748b" />
            <TextInput
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder={
                selectedLocation?.websiteUri || 'Enter website URL (e.g. https://yourstore.com)'
              }
              className="flex-1 text-xs text-slate-900 ml-2"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <Button
            title={isLoadingWebAudit ? 'Scanning...' : 'Scan URL'}
            onPress={handleStartAudit}
            size="sm"
            variant="primary"
            disabled={isLoadingWebAudit}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-1.5 mb-4 bg-slate-200/70 p-1 rounded-xl">
        <Pressable
          onPress={() => setActiveTab('gmb_audit')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'gmb_audit' ? 'bg-white shadow-xs' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'gmb_audit' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            GMB Profile ({audit ? `${audit.passedCount}/${audit.totalChecks}` : '0/6'})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('web_audit')}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === 'web_audit' ? 'bg-white shadow-xs' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'web_audit' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Website SEO
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
            Domain Rank
          </Text>
        </Pressable>
      </View>

      {activeTab === 'gmb_audit' ? (
        isLoadingAudit ? (
          <LoadingState message="Auditing Google Business Profile listing completeness..." />
        ) : audit ? (
          <View>
            <Card className="bg-white border-blue-100 mb-4 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-xs font-semibold text-slate-500">
                    {selectedLocation?.title || 'Selected GMB Listing'}
                  </Text>
                  <Text className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {audit.passedCount} of {audit.totalChecks} Checks Passed
                  </Text>
                </View>
                <Badge
                  label={`${Math.round((audit.passedCount / audit.totalChecks) * 100)}% Complete`}
                  variant={audit.passedCount >= 5 ? 'success' : 'warning'}
                  size="md"
                />
              </View>
            </Card>

            {audit.checks.map((check) => (
              <Card key={check.id} className="mb-3 bg-white border-slate-200/90 shadow-xs">
                <View className="flex-row items-start justify-between mb-1.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    {check.status === 'pass' ? (
                      <CheckCircle size={18} color="#10b981" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle size={18} color="#f59e0b" />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" />
                    )}
                    <Text className="text-sm font-bold text-slate-900 flex-1 ml-2">
                      {check.title}
                    </Text>
                  </View>
                  <Badge
                    label={check.priority.toUpperCase()}
                    variant={
                      check.status === 'pass'
                        ? 'success'
                        : check.status === 'warning'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  />
                </View>

                <Text className="text-xs text-slate-600 mb-2 pl-6 leading-relaxed">
                  {check.evidence}
                </Text>

                <View className="bg-slate-50 p-2 rounded-xl border border-slate-100 ml-6">
                  <Text className="text-[11px] font-semibold text-slate-700">
                    Recommendation: {check.action}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="bg-white p-5 items-center">
            <Text className="text-sm font-semibold text-slate-700">
              Select a GMB location above to view its live profile audit.
            </Text>
          </Card>
        )
      ) : activeTab === 'web_audit' ? (
        isLoadingWebAudit ? (
          <LoadingState
            message={`Scanning live HTML & response time for ${websiteUrl || 'website'}...`}
          />
        ) : webAudit ? (
          <View>
            <Card className="bg-white border-blue-100 mb-4 p-4">
              <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-semibold text-slate-500" numberOfLines={1}>
                    {webAudit.url} ({webAudit.responseTimeMs} ms)
                  </Text>
                  <Text className="text-3xl font-extrabold text-blue-600">
                    {webAudit.overallScore}/100
                  </Text>
                </View>
                <Badge
                  label={
                    webAudit.overallScore >= 80
                      ? 'Healthy'
                      : webAudit.overallScore > 0
                      ? 'Needs Fixes'
                      : 'Unreachable'
                  }
                  variant={
                    webAudit.overallScore >= 80
                      ? 'success'
                      : webAudit.overallScore > 0
                      ? 'warning'
                      : 'danger'
                  }
                  size="md"
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <Zap size={16} color="#2563eb" />
                  <Text className="text-[10px] text-slate-500 font-bold mt-1">Speed</Text>
                  <Text className="text-xs font-extrabold text-slate-800">
                    {webAudit.performanceScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <TrendingUp size={16} color="#10b981" />
                  <Text className="text-[10px] text-slate-500 font-bold mt-1">SEO</Text>
                  <Text className="text-xs font-extrabold text-slate-800">
                    {webAudit.seoScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <Smartphone size={16} color="#8b5cf6" />
                  <Text className="text-[10px] text-slate-500 font-bold mt-1">Mobile</Text>
                  <Text className="text-xs font-extrabold text-slate-800">
                    {webAudit.mobileScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <ShieldCheck size={16} color="#059669" />
                  <Text className="text-[10px] text-slate-500 font-bold mt-1">Security</Text>
                  <Text className="text-xs font-extrabold text-slate-800">
                    {webAudit.securityScore}%
                  </Text>
                </View>
              </View>
            </Card>

            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Live HTML & HTTP Checks ({webAudit.checks.length})
            </Text>

            {webAudit.checks.map((check) => (
              <Card key={check.id} className="mb-3 bg-white border-slate-200/90 shadow-xs">
                <View className="flex-row items-start justify-between mb-1.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    {check.status === 'pass' ? (
                      <CheckCircle size={18} color="#10b981" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle size={18} color="#f59e0b" />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" />
                    )}
                    <Text className="text-sm font-bold text-slate-900 flex-1 ml-2">
                      {check.title}
                    </Text>
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
                    Recommended Fix: {check.fixAction}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="bg-white p-5 items-center">
            <Globe size={28} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-800 mt-2">
              No Website Linked on This GMB Location
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1">
              {selectedLocation?.title || 'This location'} does not have a website URL in Google
              Business Profile. Enter a URL in the box above and tap "Scan URL" to run a live HTTP
              audit.
            </Text>
          </Card>
        )
      ) : (
        /* SEMrush Domain Research Tab */
        <View>
          <Card className="bg-white border-slate-200 mb-4">
            <Text className="text-xs font-bold text-slate-800 mb-1.5">Search Domain Authority</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={domainQuery}
                onChangeText={setDomainQuery}
                placeholder="Enter domain (e.g. yourbusiness.com)"
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
                <Badge label="SEMrush Data" variant="primary" size="sm" />
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
              <Search size={32} color="#94a3b8" />
              <Text className="text-xs text-slate-500 mt-2">
                Enter your domain above to inspect organic search ranking keywords.
              </Text>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
};
