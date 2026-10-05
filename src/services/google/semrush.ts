import axios from 'axios';
import { LoadBalancer } from '../gateway/loadBalancer';

const SEMRUSH_API_KEY = process.env.EXPO_PUBLIC_SEMRUSH_API_KEY || '';
const SEMRUSH_DATABASE = 'in';

export interface SemrushDomainData {
  domain: string;
  organicKeywords: string;
  organicTraffic: string;
  organicCost: string;
  // Live DNS & HTTP Domain Authority inspection fields
  domainAuthorityScore?: number;
  httpStatus?: number;
  responseTimeMs?: number;
  ipAddresses?: string[];
  nameServers?: string[];
  mailServers?: number;
  hasSpfRecord?: boolean;
  pageTitle?: string;
  h1Count?: number;
  internalLinksCount?: number;
  externalLinksCount?: number;
  hasSchemaOrg?: boolean;
  sslActive?: boolean;
  source?: string;
}

export interface SemrushKeywordData {
  keyword: string;
  volume: string;
  cpc: string;
  competition: string;
}

async function queryGoogleDns(domain: string, type: 'A' | 'NS' | 'MX' | 'TXT'): Promise<string[]> {
  try {
    const data: any = await LoadBalancer.execute({
      service: 'seo_audit',
      endpoint: `dns.google (${type})`,
      task: async () => {
        const res = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
        );
        if (!res.ok) return { Answer: [] };
        return await res.json();
      },
      cacheKey: `dns_${domain}_${type}`,
      cacheTtlMs: 60 * 60 * 1000, // 1 hour DNS cache
    });
    const answers = Array.isArray(data?.Answer) ? data.Answer : [];
    return answers.map((a: any) => String(a?.data || '').replace(/\.$/, '')).filter(Boolean);
  } catch {
    return [];
  }
}

export const SemrushService = {
  async fetchDomainSummary(domain: string): Promise<SemrushDomainData> {
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .split('?')[0];

    if (!cleanDomain || !cleanDomain.includes('.')) {
      throw new Error('Please enter a valid domain name (e.g. yourbusiness.com)');
    }

    // 1. Run real Google Public DNS-over-HTTPS queries in parallel
    const [aRecords, nsRecords, mxRecords, txtRecords] = await Promise.all([
      queryGoogleDns(cleanDomain, 'A'),
      queryGoogleDns(cleanDomain, 'NS'),
      queryGoogleDns(cleanDomain, 'MX'),
      queryGoogleDns(cleanDomain, 'TXT'),
    ]);

    // 2. Run real HTTP HTML & Link Authority inspection on the live domain
    let httpStatus = 0;
    let responseTimeMs = 0;
    let pageTitle = '';
    let h1Count = 0;
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    let hasSchemaOrg = false;
    let sslActive = false;

    const startMs = Date.now();
    try {
      const res = await fetch(`https://${cleanDomain}`, {
        method: 'GET',
        headers: { Accept: 'text/html,application/xhtml+xml' },
      });
      responseTimeMs = Math.max(1, Date.now() - startMs);
      httpStatus = res.status;
      sslActive = true;
      const html = await res.text();
      const lowerHtml = html.toLowerCase();

      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

      const h1Matches = html.match(/<h1[\s>]/gi);
      h1Count = h1Matches ? h1Matches.length : 0;

      hasSchemaOrg =
        lowerHtml.includes('application/ld+json') || lowerHtml.includes('schema.org');

      const hrefMatches = html.match(/href=["']([^"']+)["']/gi) || [];
      for (const h of hrefMatches) {
        const urlPart = h.replace(/^href=["']/i, '').replace(/["']$/, '');
        if (urlPart.startsWith('/') || urlPart.includes(cleanDomain)) {
          internalLinksCount++;
        } else if (urlPart.startsWith('http')) {
          externalLinksCount++;
        }
      }
    } catch {
      responseTimeMs = Math.max(1, Date.now() - startMs);
    }

    if (aRecords.length === 0 && httpStatus === 0) {
      throw new Error(
        `Domain "${cleanDomain}" did not resolve in Google DNS and is not reachable over HTTPS.`
      );
    }

    const hasSpfRecord = txtRecords.some((t) => t.toLowerCase().includes('v=spf1'));

    // Calculate real technical Domain Readiness & Authority score (0-100) from verified DNS + HTTP signals
    let technicalAuthority = 0;
    if (aRecords.length > 0) technicalAuthority += 15;
    if (nsRecords.length >= 2) technicalAuthority += 10;
    if (mxRecords.length > 0) technicalAuthority += 10;
    if (hasSpfRecord) technicalAuthority += 10;
    if (sslActive && httpStatus >= 200 && httpStatus < 400) technicalAuthority += 20;
    if (pageTitle.length > 0) technicalAuthority += 10;
    if (h1Count > 0) technicalAuthority += 5;
    if (hasSchemaOrg) technicalAuthority += 10;
    if (internalLinksCount >= 5) technicalAuthority += 10;

    // 3. Also query SEMrush API if key is configured
    if (SEMRUSH_API_KEY) {
      try {
        const res: any = await LoadBalancer.execute({
          service: 'seo_audit',
          endpoint: 'semrush/domain_ranks',
          task: () =>
            axios.get('https://api.semrush.com/', {
              params: {
                key: SEMRUSH_API_KEY,
                type: 'domain_ranks',
                domain: cleanDomain,
                database: SEMRUSH_DATABASE,
                export_columns: 'Dn,Or,Ot,Oc',
                display_limit: '1',
              },
              timeout: 6000,
            }),
          cacheKey: `semrush_${cleanDomain}`,
          cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hour cache
        });

        const text = String(res.data || '');
        if (!text.startsWith('ERROR')) {
          const lines = text.trim().split('\n').filter(Boolean);
          if (lines.length >= 2) {
            const row = lines[1].split(';');
            return {
              domain: row[0] || cleanDomain,
              organicKeywords: row[1] || '0',
              organicTraffic: row[2] || '0',
              organicCost: row[3] || '0',
              domainAuthorityScore: technicalAuthority,
              httpStatus,
              responseTimeMs,
              ipAddresses: aRecords,
              nameServers: nsRecords,
              mailServers: mxRecords.length,
              hasSpfRecord,
              pageTitle,
              h1Count,
              internalLinksCount,
              externalLinksCount,
              hasSchemaOrg,
              sslActive,
              source: 'SEMrush + Live Google DNS & HTTP',
            };
          }
        }
      } catch {
        // Fall through to live DNS + HTTP authority data
      }
    }

    return {
      domain: cleanDomain,
      organicKeywords: `${internalLinksCount} indexed links`,
      organicTraffic: httpStatus > 0 ? `HTTP ${httpStatus} (${responseTimeMs}ms)` : 'DNS Active',
      organicCost: `${aRecords.length} A · ${nsRecords.length} NS · ${mxRecords.length} MX`,
      domainAuthorityScore: technicalAuthority,
      httpStatus,
      responseTimeMs,
      ipAddresses: aRecords,
      nameServers: nsRecords,
      mailServers: mxRecords.length,
      hasSpfRecord,
      pageTitle,
      h1Count,
      internalLinksCount,
      externalLinksCount,
      hasSchemaOrg,
      sslActive,
      source: 'Live Google DNS + HTTP Inspector',
    };
  },

  async fetchKeywordData(keyword: string): Promise<SemrushKeywordData> {
    if (!SEMRUSH_API_KEY) {
      throw new Error('Semrush API key is not configured');
    }
    const url = 'https://api.semrush.com/';
    const res: any = await LoadBalancer.execute({
      service: 'seo_audit',
      endpoint: 'semrush/phrase_this',
      task: () =>
        axios.get(url, {
          params: {
            key: SEMRUSH_API_KEY,
            type: 'phrase_this',
            phrase: keyword,
            database: SEMRUSH_DATABASE,
            export_columns: 'Ph,Nq,Cp,Co',
          },
        }),
      cacheKey: `kw_${keyword}`,
      cacheTtlMs: 24 * 60 * 60 * 1000,
    });

    const text = String(res.data);
    if (text.startsWith('ERROR')) {
      throw new Error(text.replace(/^ERROR\s*\d*\s*:?\s*/, '') || 'Keyword request failed');
    }

    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) {
      throw new Error('No data found for keyword');
    }

    const row = lines[1].split(';');
    return {
      keyword: row[0],
      volume: row[1],
      cpc: row[2],
      competition: row[3],
    };
  },
};
