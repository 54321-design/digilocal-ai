import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
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
  Server,
  Link2,
} from 'lucide-react-native';
import { useSEO } from '../context/SEOContext';
import { useGoogle } from '../context/GoogleContext';
import { Card, Badge, Button, LoadingState } from '../components';

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
    researchError,
  } = useSEO();

  const [activeTab, setActiveTab] = useState<'gmb_audit' | 'web_audit' | 'semrush'>('gmb_audit');
  const [websiteUrl, setWebsiteUrl] = useState(selectedLocation?.websiteUri || '');
  const [domainQuery, setDomainQuery] = useState('');

  useEffect(() => {
    const locUrl = selectedLocation?.websiteUri || '';
    setWebsiteUrl(locUrl);
    if (locUrl) {
      const cleanedHost = locUrl
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0];
      setDomainQuery(cleanedHost);
    } else {
      setDomainQuery('');
    }
  }, [selectedLocation?.id, selectedLocation?.websiteUri]);

  const handleStartAudit = async () => {
    runAudit();
    const target = websiteUrl.trim() || domainQuery.trim();
    if (target) {
      await runWebAudit(target);
      setActiveTab('web_audit');
    } else {
      Alert.alert(
        'Website URL Required',
        'Enter a website URL in the box above (e.g. https://yourstore.com) to run a live HTTP & SEO scan.'
      );
    }
  };

  const handleSearchDomain = async () => {
    const target = domainQuery.trim() || websiteUrl.trim();
    if (!target) {
      Alert.alert('Domain Required', 'Enter a domain name (e.g. yourbusiness.com) to analyze.');
      return;
    }
    setDomainQuery(target);
    await analyzeDomain(target);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
    >
      {/* Top URL Scanner Bar */}
      <View className="bg-white p-4 rounded-2xl border border-slate-200 mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Live Website & Domain Scanner
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5">
            <Globe size={16} color="#64748b" />
            <TextInput
              value={websiteUrl}
              onChangeText={(txt) => {
                setWebsiteUrl(txt);
                if (!domainQuery) setDomainQuery(txt);
              }}
              placeholder={
                selectedLocation?.websiteUri || 'Enter website or domain (e.g. example.com)'
              }
              className="flex-1 text-xs text-slate-900 ml-2 py-0"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="search"
              onSubmitEditing={handleStartAudit}
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
          className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
            activeTab === 'gmb_audit' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'gmb_audit' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            GMB ({audit ? `${audit.passedCount}/${audit.totalChecks}` : '0/6'})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('web_audit')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
            activeTab === 'web_audit' ? 'bg-white' : ''
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
          className={`flex-1 py-2.5 rounded-lg items-center justify-center ${
            activeTab === 'semrush' ? 'bg-white' : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'semrush' ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            Domain Authority
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
                  <Text className="text-xl font-bold text-slate-900 mt-1">
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
              <Card key={check.id} className="mb-3 bg-white border-slate-200/90">
                <View className="flex-row items-start justify-between mb-1.5">
                  <View className="flex-row items-start flex-1 mr-2">
                    {check.status === 'pass' ? (
                      <CheckCircle size={18} color="#10b981" style={{ marginTop: 1 }} />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: 1 }} />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" style={{ marginTop: 1 }} />
                    )}
                    <Text className="text-sm font-bold text-slate-900 flex-1 ml-2 leading-snug">
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

                <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 ml-6">
                  <Text className="text-xs font-medium text-slate-700 leading-relaxed">
                    Recommendation: {check.action}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="bg-white p-5 items-center">
            <Text className="text-sm font-semibold text-slate-700 text-center">
              Select a Google Business location from the top header to view its profile audit.
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
                  <Text className="text-2xl font-bold text-blue-600 mt-0.5">
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
                  <Text className="text-[11px] text-slate-500 font-semibold mt-1">Speed</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {webAudit.performanceScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <TrendingUp size={16} color="#10b981" />
                  <Text className="text-[11px] text-slate-500 font-semibold mt-1">SEO</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {webAudit.seoScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <Smartphone size={16} color="#8b5cf6" />
                  <Text className="text-[11px] text-slate-500 font-semibold mt-1">Mobile</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {webAudit.mobileScore}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-2.5 rounded-xl items-center border border-slate-100">
                  <ShieldCheck size={16} color="#059669" />
                  <Text className="text-[11px] text-slate-500 font-semibold mt-1">Security</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {webAudit.securityScore}%
                  </Text>
                </View>
              </View>
            </Card>

            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Live HTML & HTTP Checks ({webAudit.checks.length})
            </Text>

            {webAudit.checks.map((check) => (
              <Card key={check.id} className="mb-3 bg-white border-slate-200/90">
                <View className="flex-row items-start justify-between mb-1.5">
                  <View className="flex-row items-start flex-1 mr-2">
                    {check.status === 'pass' ? (
                      <CheckCircle size={18} color="#10b981" style={{ marginTop: 1 }} />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: 1 }} />
                    ) : (
                      <AlertCircle size={18} color="#ef4444" style={{ marginTop: 1 }} />
                    )}
                    <Text className="text-sm font-bold text-slate-900 flex-1 ml-2 leading-snug">
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

                <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 ml-6">
                  <Text className="text-xs font-medium text-blue-900 leading-relaxed">
                    Recommended Fix: {check.fixAction}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card className="bg-white p-5 items-center">
            <Globe size={28} color="#94a3b8" />
            <Text className="text-sm font-bold text-slate-800 mt-2 text-center">
              No Website Linked on This GMB Location
            </Text>
            <Text className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
              Enter any website URL in the scanner box above and tap "Scan URL" to run a live HTTP
              & HTML SEO audit.
            </Text>
          </Card>
        )
      ) : (
        /* Domain Authority & DNS/HTTP Research Tab */
        <View>
          <Card className="bg-white border-slate-200 mb-4 p-4">
            <Text className="text-sm font-bold text-slate-900 mb-1">Search Domain Authority</Text>
            <Text className="text-xs text-slate-500 mb-3">
              Inspect live DNS records, HTTPS latency, link structure, and domain authority
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={domainQuery}
                onChangeText={setDomainQuery}
                placeholder="Enter domain (e.g. google.com or yourstore.in)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={handleSearchDomain}
              />
              <Button
                title={isResearching ? 'Checking...' : 'Search'}
                onPress={handleSearchDomain}
                size="sm"
                variant="primary"
                disabled={isResearching}
              />
            </View>
          </Card>

          {researchError ? (
            <View className="p-4 rounded-2xl bg-rose-50 border border-rose-200 mb-4 flex-row items-start">
              <AlertCircle size={18} color="#E11D48" style={{ marginTop: 1 }} />
              <Text className="text-xs text-rose-700 ml-2.5 flex-1 leading-relaxed">
                {researchError}
              </Text>
            </View>
          ) : null}

          {isResearching ? (
            <LoadingState message={`Inspecting live DNS, SSL & authority signals for ${domainQuery}...`} />
          ) : domainData ? (
            <View className="gap-3">
              <Card className="bg-white border-blue-100 p-4">
                <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-bold text-slate-900">
                      {domainData.domain}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Source: {domainData.source || 'Live DNS & HTTP Inspector'}
                    </Text>
                  </View>
                  <View
                    style={{ backgroundColor: '#EEF2FF' }}
                    className="px-3 py-1.5 rounded-xl items-center"
                  >
                    <Text style={{ color: '#1E40AF' }} className="text-base font-bold">
                      {domainData.domainAuthorityScore ?? 0}/100
                    </Text>
                    <Text style={{ color: '#1E40AF' }} className="text-[10px] font-semibold">
                      Authority Score
                    </Text>
                  </View>
                </View>

                {domainData.pageTitle ? (
                  <View className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                    <Text className="text-[11px] font-semibold text-slate-500">
                      Live Homepage Title
                    </Text>
                    <Text className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                      {domainData.pageTitle}
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row gap-2.5 mb-2.5">
                  <View className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="flex-row items-center mb-1">
                      <Link2 size={14} color="#2563EB" />
                      <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                        On-Page Links
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-900">
                      {domainData.internalLinksCount ?? 0} internal
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      {domainData.externalLinksCount ?? 0} outbound · {domainData.h1Count ?? 0} H1 tags
                    </Text>
                  </View>

                  <View className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="flex-row items-center mb-1">
                      <Zap size={14} color="#10B981" />
                      <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                        Server Status
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-slate-900">
                      {domainData.httpStatus ? `HTTP ${domainData.httpStatus}` : 'DNS Resolved'}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      {domainData.responseTimeMs ? `${domainData.responseTimeMs} ms response` : 'Active'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2.5">
                  <View className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="flex-row items-center mb-1">
                      <Server size={14} color="#8B5CF6" />
                      <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                        DNS Infrastructure
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                      {domainData.ipAddresses?.[0] || 'IPv4 Active'}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      {domainData.nameServers?.length || 0} NS · {domainData.mailServers || 0} MX records
                    </Text>
                  </View>

                  <View className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="flex-row items-center mb-1">
                      <ShieldCheck size={14} color="#059669" />
                      <Text className="text-xs font-semibold text-slate-600 ml-1.5">
                        Trust & Schema
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-900">
                      {domainData.sslActive ? 'HTTPS Active' : 'HTTP Only'}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      {domainData.hasSchemaOrg ? 'Schema.org Found' : 'No JSON-LD'} ·{' '}
                      {domainData.hasSpfRecord ? 'SPF Verified' : 'No SPF'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          ) : (
            <Card className="bg-white border-slate-200 items-center py-8 px-4">
              <Search size={30} color="#94a3b8" />
              <Text className="text-sm font-semibold text-slate-700 mt-2 text-center">
                Inspect Any Domain's Live Authority
              </Text>
              <Text className="text-xs text-slate-500 mt-1 text-center leading-relaxed">
                Enter a domain name above and tap "Search" to verify its live DNS records, HTTPS
                response speed, link structure, and technical domain authority.
              </Text>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
};
