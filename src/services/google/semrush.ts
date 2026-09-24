import axios from 'axios';

const SEMRUSH_API_KEY = process.env.EXPO_PUBLIC_SEMRUSH_API_KEY || '';
const SEMRUSH_DATABASE = 'in';

export interface SemrushDomainData {
  domain: string;
  organicKeywords: string;
  organicTraffic: string;
  organicCost: string;
}

export interface SemrushKeywordData {
  keyword: string;
  volume: string;
  cpc: string;
  competition: string;
}

export const SemrushService = {
  async fetchDomainSummary(domain: string): Promise<SemrushDomainData> {
    if (!SEMRUSH_API_KEY) {
      throw new Error('Semrush API key is not configured');
    }
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = 'https://api.semrush.com/';
    const res = await axios.get(url, {
      params: {
        key: SEMRUSH_API_KEY,
        type: 'domain_ranks',
        domain: cleanDomain,
        database: SEMRUSH_DATABASE,
        export_columns: 'Dn,Or,Ot,Oc',
        display_limit: '1',
      },
    });

    const text = String(res.data);
    if (text.startsWith('ERROR')) {
      throw new Error(text.replace(/^ERROR\s*\d*\s*:?\s*/, '') || 'Semrush request failed');
    }

    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) {
      throw new Error('No organic data found for domain');
    }

    const row = lines[1].split(';');
    return {
      domain: row[0],
      organicKeywords: row[1],
      organicTraffic: row[2],
      organicCost: row[3],
    };
  },

  async fetchKeywordData(keyword: string): Promise<SemrushKeywordData> {
    if (!SEMRUSH_API_KEY) {
      throw new Error('Semrush API key is not configured');
    }
    const url = 'https://api.semrush.com/';
    const res = await axios.get(url, {
      params: {
        key: SEMRUSH_API_KEY,
        type: 'phrase_this',
        phrase: keyword,
        database: SEMRUSH_DATABASE,
        export_columns: 'Ph,Nq,Cp,Co',
      },
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
