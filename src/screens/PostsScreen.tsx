import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SvgXml } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
  CheckCircle,
  Trash2,
  Settings,
  RefreshCw,
  ExternalLink,
  Camera,
  FileText,
  Calendar,
  Clock,
  Maximize2,
  X,
  Eye,
  TrendingUp,
  PhoneCall,
  BarChart2,
  Zap,
  Edit3,
  Layers,
  ArrowRight,
  Share2,
  Check,
  FileSpreadsheet,
  UploadCloud,
  Table,
  Link,
} from 'lucide-react-native';
import { usePosts } from '../context/PostsContext';
import { useGoogle } from '../context/GoogleContext';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useQuota } from '../context/QuotaContext';
import { AIService, buildGeminiFestivalPosterSvgUri } from '../services/ai/gemini';
import { extractCleanBrandName } from '../utils/brandExtractor';
import { GMBPostType, PostChannel, PostCallToAction, ScheduledPost } from '../types';

interface FestivalEvent {
  id: string;
  name: string;
  monthIndex: number;
  day: number;
  year: number;
  dateLabel: string;
  category: string;
  defaultCoupon: string;
}

const getFestivalsForYear = (year: number): FestivalEvent[] => {
  if (year === 2025) {
    return [
      {
        id: 'fest-navratri-2025',
        name: 'Sharad Navratri',
        monthIndex: 8,
        day: 22,
        year: 2025,
        dateLabel: '22 Sep 2025',
        category: 'Auspicious Festival',
        defaultCoupon: 'NAVRATRI20',
      },
      {
        id: 'fest-dussehra-2025',
        name: 'Gandhi Jayanti & Dussehra',
        monthIndex: 9,
        day: 2,
        year: 2025,
        dateLabel: '2 Oct 2025',
        category: 'Major Festival',
        defaultCoupon: 'DUSSEHRA20',
      },
      {
        id: 'fest-karwachauth-2025',
        name: 'Karwa Chauth Special',
        monthIndex: 9,
        day: 10,
        year: 2025,
        dateLabel: '10 Oct 2025',
        category: 'Special Occasion',
        defaultCoupon: 'KARWA15',
      },
      {
        id: 'fest-dhanteras-2025',
        name: 'Dhanteras Prosperity',
        monthIndex: 9,
        day: 18,
        year: 2025,
        dateLabel: '18 Oct 2025',
        category: 'Muhurat & Auspicious',
        defaultCoupon: 'DHANTERAS',
      },
      {
        id: 'fest-diwali-2025',
        name: 'Diwali (Lakshmi Puja)',
        monthIndex: 9,
        day: 20,
        year: 2025,
        dateLabel: '20 Oct 2025',
        category: 'Major Festival',
        defaultCoupon: 'DIWALI25',
      },
      {
        id: 'fest-govardhan-2025',
        name: 'Govardhan Puja',
        monthIndex: 9,
        day: 22,
        year: 2025,
        dateLabel: '22 Oct 2025',
        category: 'Auspicious Festival',
        defaultCoupon: 'FESTIVE20',
      },
      {
        id: 'fest-bhaidooj-2025',
        name: 'Bhai Dooj Celebration',
        monthIndex: 9,
        day: 23,
        year: 2025,
        dateLabel: '23 Oct 2025',
        category: 'Family Festival',
        defaultCoupon: 'BHAIDOOJ20',
      },
      {
        id: 'fest-chhath-2025',
        name: 'Chhath Puja Greetings',
        monthIndex: 9,
        day: 27,
        year: 2025,
        dateLabel: '27 Oct 2025',
        category: 'Cultural & Devotional',
        defaultCoupon: 'CHHATH15',
      },
      {
        id: 'fest-gurunanak-2025',
        name: 'Guru Nanak Jayanti',
        monthIndex: 10,
        day: 5,
        year: 2025,
        dateLabel: '5 Nov 2025',
        category: 'Sacred Gurpurab',
        defaultCoupon: 'GURPURAB',
      },
      {
        id: 'fest-christmas-2025',
        name: 'Christmas & Year-End',
        monthIndex: 11,
        day: 25,
        year: 2025,
        dateLabel: '25 Dec 2025',
        category: 'Holiday Season',
        defaultCoupon: 'XMAS25',
      },
    ];
  }

  // Default: Accurate 2026 Hindu Panchang & Indian Calendar Festival Dates
  return [
    {
      id: 'fest-gandhi-2026',
      name: 'Gandhi Jayanti',
      monthIndex: 9,
      day: 2,
      year: 2026,
      dateLabel: '2 Oct 2026',
      category: 'National Occasion',
      defaultCoupon: 'INDIA15',
    },
    {
      id: 'fest-navratri-2026',
      name: 'Sharad Navratri',
      monthIndex: 9,
      day: 11,
      year: 2026,
      dateLabel: '11 Oct 2026',
      category: 'Auspicious Festival',
      defaultCoupon: 'NAVRATRI20',
    },
    {
      id: 'fest-dussehra-2026',
      name: 'Dussehra (Vijayadashami)',
      monthIndex: 9,
      day: 20,
      year: 2026,
      dateLabel: '20 Oct 2026',
      category: 'Major Festival',
      defaultCoupon: 'DUSSEHRA20',
    },
    {
      id: 'fest-karwachauth-2026',
      name: 'Karwa Chauth Special',
      monthIndex: 9,
      day: 29,
      year: 2026,
      dateLabel: '29 Oct 2026',
      category: 'Special Occasion',
      defaultCoupon: 'KARWA15',
    },
    {
      id: 'fest-dhanteras-2026',
      name: 'Dhanteras Prosperity',
      monthIndex: 10,
      day: 6,
      year: 2026,
      dateLabel: '6 Nov 2026',
      category: 'Muhurat & Auspicious',
      defaultCoupon: 'DHANTERAS',
    },
    {
      id: 'fest-diwali-2026',
      name: 'Diwali (Lakshmi Puja)',
      monthIndex: 10,
      day: 8,
      year: 2026,
      dateLabel: '8 Nov 2026',
      category: 'Major Festival',
      defaultCoupon: 'DIWALI25',
    },
    {
      id: 'fest-govardhan-2026',
      name: 'Govardhan Puja',
      monthIndex: 10,
      day: 10,
      year: 2026,
      dateLabel: '10 Nov 2026',
      category: 'Auspicious Festival',
      defaultCoupon: 'FESTIVE20',
    },
    {
      id: 'fest-bhaidooj-2026',
      name: 'Bhai Dooj Celebration',
      monthIndex: 10,
      day: 11,
      year: 2026,
      dateLabel: '11 Nov 2026',
      category: 'Family Festival',
      defaultCoupon: 'BHAIDOOJ20',
    },
    {
      id: 'fest-chhath-2026',
      name: 'Chhath Puja Greetings',
      monthIndex: 10,
      day: 15,
      year: 2026,
      dateLabel: '15 Nov 2026',
      category: 'Cultural & Devotional',
      defaultCoupon: 'CHHATH15',
    },
    {
      id: 'fest-gurunanak-2026',
      name: 'Guru Nanak Jayanti',
      monthIndex: 10,
      day: 24,
      year: 2026,
      dateLabel: '24 Nov 2026',
      category: 'Sacred Gurpurab',
      defaultCoupon: 'GURPURAB',
    },
    {
      id: 'fest-christmas-2026',
      name: 'Christmas & Year-End',
      monthIndex: 11,
      day: 25,
      year: 2026,
      dateLabel: '25 Dec 2026',
      category: 'Holiday Season',
      defaultCoupon: 'XMAS25',
    },
  ];
};

const PosterGraphic: React.FC<{ uri: string }> = ({ uri }) => {
  if (!uri) return null;
  if (uri.startsWith('data:image/svg+xml;utf8,')) {
    const rawSvg = decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length));
    return <SvgXml xml={rawSvg} width="100%" height="100%" />;
  }
  return <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />;
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const PostsScreen: React.FC = () => {
  const { user } = useAuth();
  const { selectedLocation } = useGoogle();
  const {
    locationPosts,
    schedulePost,
    scheduleDraft,
    updatePost,
    publishNow,
    deletePost,
    n8nWebhookUrl,
    updateWebhookUrl,
    testWebhook,
    bulkSheetWebhookUrl,
    updateBulkSheetWebhookUrl,
    testBulkSheetWebhook,
    dispatchBulkSheetUpload,
    scheduleBatchPosts,
    clearStorageAndCache,
  } = usePosts();
  const { connectors, connectAccount, disconnectAccount } = useSocial();
  const { runWithQuota } = useQuota();

  // Top Level Navigation Tabs: 'studio' | 'scheduled' | 'draft' | 'all'
  const [activeTab, setActiveTab] = useState<'studio' | 'sheet' | 'scheduled' | 'draft' | 'all'>('studio');
  const [scheduledViewMode, setScheduledViewMode] = useState<'list' | 'calendar'>('list');
  const [allPostsFilter, setAllPostsFilter] = useState<'all' | 'scheduled' | 'draft' | 'published'>('all');

  // Dedicated Draft Editor Modal State
  const [editingDraftPost, setEditingDraftPost] = useState<any | null>(null);
  const [editGmbText, setEditGmbText] = useState('');
  const [editSocialText, setEditSocialText] = useState('');
  const [editChannels, setEditChannels] = useState<PostChannel[]>(['gmb']);
  const [isCopyAccordionOpen, setIsCopyAccordionOpen] = useState(false);

  // Calendar month/year state
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const upcomingFestivals = useMemo(() => getFestivalsForYear(calendarYear), [calendarYear]);
  const [selectedFestival, setSelectedFestival] = useState<FestivalEvent>(
    () => getFestivalsForYear(new Date().getFullYear())[5] || getFestivalsForYear(2026)[5]
  );
  const [brandNameInput, setBrandNameInput] = useState<string>(() =>
    extractCleanBrandName(selectedLocation?.title)
  );
  const [businessCategoryInput, setBusinessCategoryInput] = useState<string>(
    selectedLocation?.categories?.primaryCategory?.displayName || ''
  );
  const [offerInput, setOfferInput] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Draft Scheduling Modal State
  const [schedulingDraftPost, setSchedulingDraftPost] = useState<any | null>(null);
  const [scheduleTargetDate, setScheduleTargetDate] = useState<number>(() => Date.now());

  const [postType, setPostType] = useState<GMBPostType>('OFFER');
  const [gmbSummary, setGmbSummary] = useState('');
  const [socialCaption, setSocialCaption] = useState('');
  const [activeCaptionTab, setActiveCaptionTab] = useState<'gmb' | 'social'>('gmb');
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterStyleVariant, setPosterStyleVariant] = useState<number>(0);
  const [lastPosterData, setLastPosterData] = useState<{
    themeHeadline: string;
    subHeadline: string;
    festivalGreeting: string;
    offerBadgeText: string;
    categoryHighlights: string[];
  } | null>(null);
  const [previewPosterUrl, setPreviewPosterUrl] = useState<string | null>(null);

  const [selectedChannels, setSelectedChannels] = useState<PostChannel[]>([
    'gmb',
    'instagram',
    'facebook',
    'linkedin',
  ]);
  const [ctaType, setCtaType] = useState<PostCallToAction['actionType']>('LEARN_MORE');
  const [ctaUrl, setCtaUrl] = useState(selectedLocation?.websiteUri || '');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Social Login Modal State
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'facebook' | 'linkedin' | null>(
    null
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Cloud Auto-Publisher & Developer Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Manual Bulk Upload State (CSV, Excel & Google Sheets via n8n)
  const [sheetUploadMode, setSheetUploadMode] = useState<'csv_upload' | 'csv_paste' | 'sheet_link'>('csv_upload');
  const [googleSheetUrlInput, setGoogleSheetUrlInput] = useState('');
  const [rawCsvTextInput, setRawCsvTextInput] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [isDispatchingSheet, setIsDispatchingSheet] = useState(false);
  const [isImportingToSchedule, setIsImportingToSchedule] = useState(false);
  const [parsedCsvPosts, setParsedCsvPosts] = useState<Array<{
    date: string;
    timestamp: number;
    caption: string;
    offerCode: string;
    imageUrl: string;
    channels: PostChannel[];
  }>>([]);
  const [sheetDispatchStatus, setSheetDispatchStatus] = useState<{
    success: boolean;
    message: string;
    timestamp?: number;
  } | null>(null);
  const [customSheetWebhook, setCustomSheetWebhook] = useState(bulkSheetWebhookUrl || '');
  const [showSheetWebhookConfig, setShowSheetWebhookConfig] = useState(false);
  const [isTestingSheetWebhook, setIsTestingSheetWebhook] = useState(false);
  const [sheetWebhookTestResult, setSheetWebhookTestResult] = useState<string | null>(null);

  const SAMPLE_CSV_TEMPLATE = `Date,Caption,Offer_Code,Image_URL,Channels
2026-10-15 10:00 AM,"Navratri Grand Festive Offer! Get 20% off on all services.",NAVRATRI20,https://images.unsplash.com/photo-1544816155-12df9643f363,"Google, Instagram, Facebook"
2026-10-20 11:30 AM,"Dussehra Mega Celebration Deal! Book now and get free consultation.",DUSSEHRA,https://images.unsplash.com/photo-1512917774080-9991f1c4c750,"Google, Facebook"
2026-11-08 10:00 AM,"Happy Diwali from our team! Special holiday discount for you.",DIWALI25,https://images.unsplash.com/photo-1607604276583-eef5d076aa5f,"Google, Instagram, Facebook, LinkedIn"`;

  const parseCsvStringToPosts = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const results: Array<{
      date: string;
      timestamp: number;
      caption: string;
      offerCode: string;
      imageUrl: string;
      channels: PostChannel[];
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let inQuotes = false;
      let current = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));

      if (values.length >= 2 && values[1].length > 0) {
        const dateStr = values[0] || '';
        let parsedTime = Date.parse(dateStr);
        if (isNaN(parsedTime) || parsedTime <= Date.now()) {
          parsedTime = Date.now() + i * 86400000 * 2;
        }

        const rawChannels = values[4] ? values[4].toLowerCase() : 'google,instagram,facebook';
        const targetChannels: PostChannel[] = [];
        if (rawChannels.includes('google') || rawChannels.includes('gmb')) targetChannels.push('gmb');
        if (rawChannels.includes('instagram')) targetChannels.push('instagram');
        if (rawChannels.includes('facebook')) targetChannels.push('facebook');
        if (rawChannels.includes('linkedin')) targetChannels.push('linkedin');
        if (targetChannels.length === 0) targetChannels.push('gmb', 'instagram', 'facebook');

        results.push({
          date:
            dateStr ||
            new Date(parsedTime).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          timestamp: parsedTime,
          caption: values[1],
          offerCode: values[2] || '',
          imageUrl: values[3] || '',
          channels: targetChannels,
        });
      }
    }
    return results;
  };

  useEffect(() => {
    if (bulkSheetWebhookUrl) {
      setCustomSheetWebhook(bulkSheetWebhookUrl);
    }
  }, [bulkSheetWebhookUrl]);

  const handlePickSpreadsheet = async () => {
    try {
      setIsPickingFile(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedDocFile(asset);
        setSheetDispatchStatus(null);

        // If CSV, read and parse immediately
        if (asset.name.toLowerCase().endsWith('.csv') || asset.mimeType?.includes('csv')) {
          try {
            const resp = await fetch(asset.uri);
            const text = await resp.text();
            const parsed = parseCsvStringToPosts(text);
            if (parsed.length > 0) {
              setParsedCsvPosts(parsed);
              Alert.alert('CSV Parsed Successfully', `Found ${parsed.length} campaigns in ${asset.name}! Preview below.`);
            }
          } catch {
            // fallback
          }
        }
      }
    } catch (err: any) {
      Alert.alert('File Selection', err.message || 'Unable to pick file');
    } finally {
      setIsPickingFile(false);
    }
  };

  const handleLoadSampleCsv = () => {
    setRawCsvTextInput(SAMPLE_CSV_TEMPLATE);
    const parsed = parseCsvStringToPosts(SAMPLE_CSV_TEMPLATE);
    setParsedCsvPosts(parsed);
    setSheetUploadMode('csv_paste');
    Alert.alert(
      'Sample Template Loaded',
      '3 sample festival campaigns have been loaded! You can preview them below and tap "Schedule All in App".'
    );
  };

  const handleImportParsedPostsToSchedule = async () => {
    if (parsedCsvPosts.length === 0) {
      Alert.alert('No Posts Parsed', 'Please select a CSV file or paste valid CSV data first.');
      return;
    }

    setIsImportingToSchedule(true);
    try {
      const inputs = parsedCsvPosts.map((p) => ({
        postType: 'OFFER' as const,
        summary: p.caption,
        offerDetails: p.offerCode ? { couponCode: p.offerCode } : undefined,
        mediaUrl: p.imageUrl || undefined,
        channels: p.channels,
        scheduledTime: p.timestamp,
        statusOverride: 'scheduled' as const,
      }));

      await scheduleBatchPosts(inputs);

      Alert.alert(
        'CSV Posts Scheduled Successfully!',
        `Imported and scheduled ${parsedCsvPosts.length} posts from your CSV! You can view them right now in the Scheduled tab.`,
        [
          {
            text: 'Go to Scheduled Tab',
            onPress: () => setActiveTab('scheduled'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import Failed', err.message || 'Error importing posts');
    } finally {
      setIsImportingToSchedule(false);
    }
  };

  const handleSubmitBulkSheet = async () => {
    if (sheetUploadMode === 'sheet_link') {
      if (!googleSheetUrlInput.trim()) {
        Alert.alert('Sheet Link Required', 'Please enter your Google Sheet link.');
        return;
      }
      if (!googleSheetUrlInput.includes('docs.google.com/spreadsheets')) {
        Alert.alert(
          'Invalid Link',
          'Please enter a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)'
        );
        return;
      }
    } else if (sheetUploadMode === 'csv_paste') {
      if (!rawCsvTextInput.trim()) {
        Alert.alert('CSV Text Required', 'Please paste your CSV text or load sample template.');
        return;
      }
    } else {
      if (!selectedDocFile) {
        Alert.alert('File Required', 'Please choose a CSV or Excel file first.');
        return;
      }
    }

    setIsDispatchingSheet(true);
    setSheetDispatchStatus(null);
    try {
      const res = await dispatchBulkSheetUpload({
        uploadMode: sheetUploadMode === 'sheet_link' ? 'google_sheet' : 'excel_file',
        googleSheetUrl: sheetUploadMode === 'sheet_link' ? googleSheetUrlInput.trim() : undefined,
        fileInfo: selectedDocFile
          ? {
              name: selectedDocFile.name,
              size: selectedDocFile.size,
              mimeType: selectedDocFile.mimeType,
              uri: selectedDocFile.uri,
            }
          : undefined,
        locationId: selectedLocation?.id || selectedLocation?.googleName || 'loc_active',
        locationName: selectedLocation?.title || 'Selected Business Location',
        userEmail: user?.email || undefined,
        customWebhookUrl: customSheetWebhook.trim() || undefined,
      });

      setSheetDispatchStatus({
        success: res.success,
        message: res.message,
        timestamp: Date.now(),
      });

      if (res.success) {
        Alert.alert('Dispatched to n8n Backend', res.message);
      } else {
        Alert.alert('Upload Status', res.message);
      }
    } catch (err: any) {
      setSheetDispatchStatus({
        success: false,
        message: err.message || 'Failed to dispatch to n8n backend',
        timestamp: Date.now(),
      });
      Alert.alert('Error', err.message || 'Failed to dispatch sheet');
    } finally {
      setIsDispatchingSheet(false);
    }
  };
  const [tempWebhookUrl, setTempWebhookUrl] = useState(n8nWebhookUrl);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setBrandNameInput(extractCleanBrandName(selectedLocation?.title));
    setBusinessCategoryInput(selectedLocation?.categories?.primaryCategory?.displayName || '');
    setCtaUrl(selectedLocation?.websiteUri || '');
  }, [
    selectedLocation?.id,
    selectedLocation?.title,
    selectedLocation?.categories?.primaryCategory?.displayName,
    selectedLocation?.websiteUri,
  ]);

  const getPostEffectiveStatus = (p: ScheduledPost): 'scheduled' | 'draft' | 'published' => {
    if (p.status === 'scheduled' || p.status === 'draft' || p.status === 'published') {
      return p.status;
    }
    if (p.scheduledTime && p.scheduledTime > Date.now()) {
      return 'scheduled';
    }
    return 'draft';
  };

  const scheduledPosts = useMemo(
    () => locationPosts.filter((p) => getPostEffectiveStatus(p) === 'scheduled'),
    [locationPosts]
  );
  const draftPosts = useMemo(
    () => locationPosts.filter((p) => getPostEffectiveStatus(p) === 'draft'),
    [locationPosts]
  );
  const publishedPosts = useMemo(
    () => locationPosts.filter((p) => getPostEffectiveStatus(p) === 'published'),
    [locationPosts]
  );

  const displayedAllPosts = useMemo(() => {
    if (allPostsFilter === 'scheduled') return scheduledPosts;
    if (allPostsFilter === 'draft') return draftPosts;
    if (allPostsFilter === 'published') return publishedPosts;
    return locationPosts;
  }, [allPostsFilter, locationPosts, scheduledPosts, draftPosts, publishedPosts]);

  const formatScheduledDateTime = (timestamp: number) => {
    if (!timestamp) return 'Upcoming';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Aggregate Campaign ROI & Performance Metrics
  const totalViews = useMemo(
    () => publishedPosts.reduce((acc, p) => acc + (p.analytics?.views || 0), 0),
    [publishedPosts]
  );
  const totalClicks = useMemo(
    () => publishedPosts.reduce((acc, p) => acc + (p.analytics?.clicks || 0), 0),
    [publishedPosts]
  );
  const totalCalls = useMemo(
    () => publishedPosts.reduce((acc, p) => acc + (p.analytics?.calls || 0), 0),
    [publishedPosts]
  );
  const avgEngagement = useMemo(() => {
    if (publishedPosts.length === 0) return 8.4;
    const sum = publishedPosts.reduce((acc, p) => acc + (p.analytics?.engagementRate || 0), 0);
    return parseFloat((sum / publishedPosts.length).toFixed(1));
  }, [publishedPosts]);

  // Build calendar cells (Monday-first grid)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    const leadingEmptyDays = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: Array<number | null> = [];
    for (let i = 0; i < leadingEmptyDays; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [calendarYear, calendarMonth]);

  // Determine badge color for each day in the active month from real locationPosts
  const getDayStatus = (day: number): 'posted' | 'scheduled' | 'draft' | null => {
    const matchingPost = locationPosts.find((p) => {
      const dt = new Date(p.scheduledTime);
      return (
        dt.getFullYear() === calendarYear &&
        dt.getMonth() === calendarMonth &&
        dt.getDate() === day
      );
    });
    if (matchingPost) {
      if (matchingPost.status === 'published') return 'posted';
      if (matchingPost.status === 'scheduled') return 'scheduled';
      if (matchingPost.status === 'draft') return 'draft';
    }
    return null;
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const festOnDay = upcomingFestivals.find(
      (f) => f.monthIndex === calendarMonth && f.day === day
    );
    if (festOnDay) {
      setSelectedFestival(festOnDay);
      setCouponCode(festOnDay.defaultCoupon);
    }
  };

  const handleSelectFestival = (fest: FestivalEvent) => {
    setSelectedFestival(fest);
    setCalendarYear(fest.year);
    setCalendarMonth(fest.monthIndex);
    setSelectedDay(fest.day);
    setCouponCode(fest.defaultCoupon);
  };

  const handleGenerateFestivalPost = async (nextVariant?: number) => {
    const bCategory =
      businessCategoryInput.trim() ||
      selectedLocation?.categories?.primaryCategory?.displayName ||
      '';

    if (!bCategory) {
      Alert.alert(
        'Business Category Required',
        'Please enter your business category or industry (e.g. "Dental Clinic", "Digital Marketing", "Salon") before generating.'
      );
      return;
    }

    await runWithQuota(
      'post_generation',
      'AI Festival & Marketing Post Generation',
      async () => {
        setIsGeneratingAI(true);
        const variantToUse = typeof nextVariant === 'number' ? nextVariant : posterStyleVariant;
        try {
          const bName =
            brandNameInput.trim() || extractCleanBrandName(selectedLocation?.title);

          const platformNames = selectedChannels.map((ch) => {
            switch (ch) {
              case 'gmb':
                return 'Google Business Profile';
              case 'instagram':
                return 'Instagram';
              case 'facebook':
                return 'Facebook';
              case 'linkedin':
                return 'LinkedIn';
              default:
                return ch;
            }
          });

          const bLocation = selectedLocation?.storefrontAddress
            ? [
                ...(selectedLocation.storefrontAddress.addressLines || []),
                selectedLocation.storefrontAddress.locality,
                selectedLocation.storefrontAddress.administrativeArea,
              ]
                .filter(Boolean)
                .join(', ')
            : undefined;

          const generated = await AIService.generateFestivalPostCampaign({
            festivalName: selectedFestival.name,
            festivalDate: selectedFestival.dateLabel,
            businessName: bName,
            businessCategory: bCategory,
            businessLocation: bLocation,
            keyword: bCategory,
            offer: offerInput.trim() || undefined,
            selectedPlatforms: platformNames,
            styleVariant: variantToUse,
          });

          setGmbSummary(generated.gmbCaption);
          setSocialCaption(generated.socialCaption);
          setPostType(generated.postType);
          if (generated.couponCode) {
            setCouponCode(generated.couponCode);
          } else {
            setCouponCode('');
          }
          setCtaType(generated.ctaType);
          setLastPosterData({
            themeHeadline: generated.themeHeadline,
            subHeadline: generated.subHeadline,
            festivalGreeting: generated.festivalGreeting,
            offerBadgeText: generated.offerBadgeText,
            categoryHighlights: generated.categoryHighlights,
          });
          setMediaUrl(generated.suggestedImageUrl);
          if (previewPosterUrl) {
            setPreviewPosterUrl(generated.suggestedImageUrl);
          }

          // Auto-save generated campaign directly as Draft
          const draftScheduledTime = new Date(
            calendarYear,
            calendarMonth,
            selectedDay,
            10,
            0
          ).getTime();
          const combinedSummary =
            generated.socialCaption && generated.gmbCaption
              ? `${generated.gmbCaption}\n\n[Social Copy]: ${generated.socialCaption}`
              : generated.gmbCaption || generated.socialCaption;

          await schedulePost({
            postType: generated.postType,
            summary: combinedSummary,
            mediaUrl: generated.suggestedImageUrl,
            callToAction: {
              actionType: generated.ctaType,
              url: ctaUrl.trim() || undefined,
            },
            offerDetails: generated.hasOffer ? { couponCode: generated.couponCode } : undefined,
            channels: selectedChannels,
            scheduledTime: draftScheduledTime,
            statusOverride: 'draft',
          });

          // Switch view to Drafts tab immediately
          setActiveTab('draft');

          Alert.alert(
            'Saved to Drafts! 🎨',
            `Your ${selectedFestival.name} campaign poster for "${bCategory}" has been generated and saved directly to Drafts.\n\nYou can review it in the Drafts list below, schedule it on the calendar, or publish whenever you are ready.`
          );
        } catch (e: any) {
          Alert.alert('Post Generator', e.message || 'Could not generate post');
          throw e;
        } finally {
          setIsGeneratingAI(false);
        }
      }
    );
  };

  const handleSwitchPosterTheme = (variantIndex: number) => {
    setPosterStyleVariant(variantIndex);
    if (lastPosterData) {
      const bName =
        brandNameInput.trim() || extractCleanBrandName(selectedLocation?.title);
      const bCategory =
        businessCategoryInput.trim() ||
        selectedLocation?.categories?.primaryCategory?.displayName ||
        'Local Business & Services';
      const updatedUri = buildGeminiFestivalPosterSvgUri({
        festivalName: selectedFestival.name,
        festivalDate: selectedFestival.dateLabel,
        businessName: bName,
        businessCategory: bCategory,
        themeHeadline: lastPosterData.themeHeadline,
        subHeadline: lastPosterData.subHeadline,
        festivalGreeting: lastPosterData.festivalGreeting,
        hasOffer: Boolean(lastPosterData.offerBadgeText),
        offerBadgeText: lastPosterData.offerBadgeText,
        categoryHighlights: lastPosterData.categoryHighlights,
        couponCode: couponCode || undefined,
        styleVariant: variantIndex,
      });
      setMediaUrl(updatedUri);
      if (previewPosterUrl) {
        setPreviewPosterUrl(updatedUri);
      }
    } else {
      handleGenerateFestivalPost(variantIndex);
    }
  };

  const toggleChannel = (channel: PostChannel) => {
    if (channel === 'gmb') return;
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleCreatePost = async (mode: 'draft' | 'scheduled' | 'published') => {
    const finalSummary = gmbSummary.trim() || socialCaption.trim();
    if (!finalSummary) {
      Alert.alert(
        'Post Content Required',
        'Tap "Generate Poster" first or write your post caption below.'
      );
      return;
    }

    setIsSubmitting(true);
    const scheduledTime =
      mode === 'published'
        ? Date.now()
        : new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime();

    const combinedSummary =
      socialCaption.trim() && gmbSummary.trim()
        ? `${gmbSummary.trim()}\n\n[Social Copy]: ${socialCaption.trim()}`
        : finalSummary;

    const result = await schedulePost({
      postType,
      summary: combinedSummary,
      mediaUrl: mediaUrl.trim() || undefined,
      callToAction: {
        actionType: ctaType,
        url: ctaUrl.trim() || undefined,
      },
      offerDetails: postType === 'OFFER' ? { couponCode: couponCode || 'FESTIVE20' } : undefined,
      channels: selectedChannels,
      scheduledTime,
      statusOverride: mode,
    });

    setIsSubmitting(false);
    if (result.success) {
      setGmbSummary('');
      setSocialCaption('');
      if (mode === 'draft') {
        setActiveTab('draft');
      } else if (mode === 'scheduled') {
        setActiveTab('scheduled');
      } else {
        setActiveTab('all');
      }
      Alert.alert('Post Saved', result.message);
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  // Social Media Connect Handlers
  const handleOpenSocialConnect = (platform: 'instagram' | 'facebook' | 'linkedin') => {
    const existing = connectors.find((c) => c.platform === platform);
    if (existing?.connected) {
      Alert.alert(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected`,
        `Connected as ${existing.handle} (${existing.connectedEmail || 'Active'})`,
        [
          { text: 'Keep Connected', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => disconnectAccount(existing.id),
          },
        ]
      );
      return;
    }
    setActivePlatform(platform);
    setLoginEmail(user?.email || '');
    setLoginPassword('');
    setAccountHandle('');
  };

  const handleConfirmSocialConnect = async () => {
    if (!activePlatform) return;
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      Alert.alert('Email Required', 'Please enter the email address for your social account.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your account password or token.');
      return;
    }

    setIsAuthenticating(true);
    const emailPrefix = loginEmail.trim().split('@')[0];
    const finalName = `${emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)}`;
    const finalHandle =
      accountHandle.trim() || (activePlatform === 'instagram' ? `@${emailPrefix}` : finalName);

    setTimeout(async () => {
      await connectAccount(activePlatform, finalName, finalHandle, loginEmail.trim());
      setIsAuthenticating(false);
      setActivePlatform(null);
    }, 500);
  };

  const handleLaunchBrowserOAuth = async () => {
    if (!activePlatform) return;
    const urls: Record<string, string> = {
      facebook: 'https://www.facebook.com/login.php',
      instagram: 'https://www.instagram.com/accounts/login/',
      linkedin: 'https://www.linkedin.com/login',
    };
    try {
      await WebBrowser.openBrowserAsync(urls[activePlatform] || 'https://google.com');
    } catch {
      // ignore
    }
  };

  const handleOpenDraftEditor = (post: any) => {
    setEditingDraftPost(post);
    const parts = (post.summary || '').split('\n\n[Social Copy]: ');
    setEditGmbText(parts[0] || '');
    setEditSocialText(parts[1] || parts[0] || '');
    setEditChannels(post.channels && post.channels.length > 0 ? post.channels : ['gmb']);
  };

  const handleSaveDraftChanges = async () => {
    if (!editingDraftPost) return;
    try {
      const combinedSummary = editSocialText.trim()
        ? `${editGmbText.trim()}\n\n[Social Copy]: ${editSocialText.trim()}`
        : editGmbText.trim();
      await updatePost(editingDraftPost.id, {
        summary: combinedSummary,
        channels: editChannels,
      });
      Alert.alert('Draft Updated', 'Campaign draft updated successfully.');
      setEditingDraftPost(null);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update draft');
    }
  };

  const handlePublishDraftFromModal = async () => {
    if (!editingDraftPost) return;
    try {
      const res = await publishNow(editingDraftPost.id);
      Alert.alert('Publish Status', res.message);
      setEditingDraftPost(null);
    } catch (e: any) {
      Alert.alert('Publish Error', e.message || 'Could not publish post');
    }
  };

  const handleOpenDraftInStudio = () => {
    if (!editingDraftPost) return;
    if (editingDraftPost.mediaUrl) setMediaUrl(editingDraftPost.mediaUrl);
    const parts = (editingDraftPost.summary || '').split('\n\n[Social Copy]: ');
    setGmbSummary(parts[0] || '');
    setSocialCaption(parts[1] || parts[0] || '');
    if (editingDraftPost.channels) setSelectedChannels(editingDraftPost.channels);
    setEditingDraftPost(null);
    setActiveTab('studio');
  };

  const renderPostCard = (post: ScheduledPost) => {
    const status = getPostEffectiveStatus(post);
    return (
      <View
        key={post.id}
        style={{
          borderColor:
            status === 'scheduled'
              ? '#BFDBFE'
              : status === 'draft'
              ? '#FDE68A'
              : '#E2E8F0',
          borderWidth: 1,
        }}
        className="p-4 rounded-2xl bg-white mb-3 shadow-xs"
      >
        {/* Prominent Status Banner */}
        {status === 'scheduled' ? (
          <View className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <Clock size={15} color="#2563EB" />
              <Text className="text-xs font-bold text-blue-900 ml-2">
                This post is scheduled for {formatScheduledDateTime(post.scheduledTime)}
              </Text>
            </View>
            <View className="bg-blue-600 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Scheduled</Text>
            </View>
          </View>
        ) : status === 'draft' ? (
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <FileText size={15} color="#D97706" />
              <Text className="text-xs font-bold text-amber-900 ml-2">
                Draft Saved • Not scheduled yet
              </Text>
            </View>
            <View className="bg-amber-500 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Draft</Text>
            </View>
          </View>
        ) : (
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <CheckCircle size={15} color="#16A34A" />
              <Text className="text-xs font-bold text-emerald-900 ml-2">
                Published • Live on GMB & Social Channels
              </Text>
            </View>
            <View className="bg-emerald-600 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Live</Text>
            </View>
          </View>
        )}

        <View className="flex-row items-start mb-3">
          {post.mediaUrl ? (
            <Pressable
              onPress={() => setPreviewPosterUrl(post.mediaUrl!)}
              style={{ width: 68, height: 85, borderColor: '#CBD5E1', borderWidth: 1 }}
              className="rounded-xl overflow-hidden mr-3 bg-slate-900"
            >
              <PosterGraphic uri={post.mediaUrl} />
              <View className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-md">
                <Maximize2 size={10} color="#FFFFFF" />
              </View>
            </Pressable>
          ) : null}
          <View className="flex-1">
            <Text className="text-xs text-slate-800 leading-relaxed font-medium" numberOfLines={3}>
              {post.summary}
            </Text>
            <Text
              className={`text-[11px] mt-1 font-semibold ${
                status === 'scheduled'
                  ? 'text-blue-600'
                  : status === 'draft'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {status === 'scheduled'
                ? 'Auto-publishes via Cloud & n8n'
                : status === 'draft'
                ? 'Tap Schedule to assign a date'
                : `Published on ${new Date(post.scheduledTime || post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </Text>
          </View>
        </View>

        {/* Channels & Action Row */}
        <View className="pt-2.5 border-t border-slate-100 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            {post.channels.map((ch) => (
              <View key={ch} className="px-2 py-0.5 rounded-md bg-slate-100">
                <Text className="text-[10px] font-bold text-slate-600 uppercase">
                  {ch === 'gmb' ? 'Google' : ch}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            {status === 'draft' && (
              <Pressable
                onPress={() => {
                  setSchedulingDraftPost(post);
                  setScheduleTargetDate(
                    new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                  );
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 flex-row items-center shadow-xs"
              >
                <Calendar size={11} color="#FFFFFF" />
                <Text className="text-[11px] font-bold text-white ml-1">Schedule</Text>
              </Pressable>
            )}

            {status === 'scheduled' && (
              <Pressable
                onPress={() => {
                  setSchedulingDraftPost(post);
                  setScheduleTargetDate(post.scheduledTime || Date.now());
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex-row items-center"
              >
                <Calendar size={11} color="#2563EB" />
                <Text className="text-[11px] font-bold text-blue-700 ml-1">Reschedule</Text>
              </Pressable>
            )}

            {status === 'draft' && (
              <Pressable
                onPress={() => handleOpenDraftEditor(post)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex-row items-center"
              >
                <Edit3 size={11} color="#4F46E5" />
                <Text className="text-[11px] font-bold text-indigo-700 ml-1">Edit</Text>
              </Pressable>
            )}

            {status !== 'published' && (
              <Pressable
                onPress={async () => {
                  const res = await publishNow(post.id);
                  Alert.alert('Publish Update', res.message);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 flex-row items-center shadow-xs"
              >
                <Send size={11} color="#FFFFFF" />
                <Text className="text-[11px] font-bold text-white ml-1">Post Now</Text>
              </Pressable>
            )}

            <Pressable onPress={() => deletePost(post.id)} className="p-1.5">
              <Trash2 size={15} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Feature 3: Live Post Performance & ROI Feedback Bar */}
        {status === 'published' && (
          <View className="mt-2.5 pt-2.5 border-t border-slate-100 flex-row items-center justify-between bg-slate-50/90 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Eye size={12} color="#475569" />
                <Text className="text-[11px] font-bold text-slate-700 ml-1">
                  {(post.analytics?.views ?? 280).toLocaleString()}
                </Text>
                <Text className="text-[10px] text-slate-400 ml-0.5">views</Text>
              </View>
              <View className="flex-row items-center">
                <TrendingUp size={12} color="#2563EB" />
                <Text className="text-[11px] font-bold text-blue-700 ml-1">
                  {post.analytics?.clicks ?? 22}
                </Text>
                <Text className="text-[10px] text-slate-400 ml-0.5">clicks</Text>
              </View>
              <View className="flex-row items-center">
                <PhoneCall size={12} color="#16A34A" />
                <Text className="text-[11px] font-bold text-emerald-700 ml-1">
                  {post.analytics?.calls ?? 5}
                </Text>
                <Text className="text-[10px] text-slate-400 ml-0.5">calls</Text>
              </View>
            </View>
            <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-emerald-800">
                {post.analytics?.engagementRate ?? 8.1}% Eng.
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSocialCalendarView = () => (
    <View className="bg-white px-5 pt-5 pb-6 mb-3 rounded-2xl border border-slate-200 shadow-xs">
      <Text style={{ color: '#131A38' }} className="text-lg font-bold mb-4">
        Social Publishing Calendar
      </Text>

      {/* Month Selector Row */}
      <View className="flex-row items-center justify-between px-4 mb-5">
        <Pressable
          onPress={handlePrevMonth}
          style={{ borderColor: '#CBD5E1', borderWidth: 1 }}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ChevronLeft size={18} color="#334155" />
        </Pressable>

        <Text className="text-base font-bold text-slate-900">
          {MONTH_NAMES[calendarMonth]} {calendarYear}
        </Text>

        <Pressable
          onPress={handleNextMonth}
          style={{ borderColor: '#CBD5E1', borderWidth: 1 }}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ChevronRight size={18} color="#334155" />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View className="flex-row mb-2">
        {WEEKDAYS.map((dayName) => (
          <View key={dayName} className="flex-1 items-center">
            <Text className="text-[11px] font-semibold text-slate-500">{dayName}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days Grid */}
      <View className="flex-row flex-wrap mb-3">
        {calendarCells.map((dayNum, index) => {
          if (dayNum === null) {
            return <View key={`empty-${index}`} style={{ width: '14.28%' }} className="h-11" />;
          }

          const status = getDayStatus(dayNum);
          const isSelected = selectedDay === dayNum;
          const festOnDay = upcomingFestivals.find(
            (f) => f.monthIndex === calendarMonth && f.day === dayNum
          );

          let circleBg = 'transparent';
          let textColor = '#1E293B';

          if (status === 'posted') {
            circleBg = '#1E8E3E';
            textColor = '#FFFFFF';
          } else if (status === 'scheduled') {
            circleBg = '#2563EB';
            textColor = '#FFFFFF';
          } else if (status === 'draft') {
            circleBg = '#F4B400';
            textColor = '#FFFFFF';
          } else if (festOnDay) {
            circleBg = '#FFF7ED';
            textColor = '#C2410C';
          } else if (isSelected) {
            circleBg = '#F1F5F9';
            textColor = '#0F172A';
          }

          return (
            <Pressable
              key={`day-${dayNum}`}
              onPress={() => handleSelectDay(dayNum)}
              style={{ width: '14.28%' }}
              className="h-11 items-center justify-center"
            >
              <View
                style={{
                  backgroundColor: circleBg,
                  borderWidth: isSelected && !status ? 1.5 : festOnDay && !status ? 1.5 : 0,
                  borderColor: isSelected ? '#131A38' : festOnDay ? '#FB923C' : '#94A3B8',
                }}
                className="w-9 h-9 rounded-full items-center justify-center"
              >
                <Text style={{ color: textColor }} className="text-sm font-semibold">
                  {dayNum}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Status Legend Pills */}
      <View className="flex-row flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100">
        <View
          style={{ backgroundColor: '#FFF7ED' }}
          className="flex-row items-center px-2.5 py-1 rounded-full"
        >
          <View style={{ backgroundColor: '#EA580C' }} className="w-2 h-2 rounded-full mr-1.5" />
          <Text style={{ color: '#9A3412' }} className="text-xs font-medium">
            Festival
          </Text>
        </View>

        <View
          style={{ backgroundColor: '#FEF9E7' }}
          className="flex-row items-center px-2.5 py-1 rounded-full"
        >
          <View style={{ backgroundColor: '#F4B400' }} className="w-2 h-2 rounded-full mr-1.5" />
          <Text style={{ color: '#785A08' }} className="text-xs font-medium">
            Draft
          </Text>
        </View>

        <View
          style={{ backgroundColor: '#EFF6FF' }}
          className="flex-row items-center px-2.5 py-1 rounded-full"
        >
          <View style={{ backgroundColor: '#2563EB' }} className="w-2 h-2 rounded-full mr-1.5" />
          <Text style={{ color: '#1E40AF' }} className="text-xs font-medium">
            Scheduled
          </Text>
        </View>

        <View
          style={{ backgroundColor: '#ECFDF3' }}
          className="flex-row items-center px-2.5 py-1 rounded-full"
        >
          <View style={{ backgroundColor: '#1E8E3E' }} className="w-2 h-2 rounded-full mr-1.5" />
          <Text style={{ color: '#166534' }} className="text-xs font-medium">
            Posted
          </Text>
        </View>
      </View>

      {/* Selected Day Activity Inspector */}
      {(() => {
        const postsOnSelectedDay = locationPosts.filter((p) => {
          const dt = new Date(p.scheduledTime);
          return (
            dt.getFullYear() === calendarYear &&
            dt.getMonth() === calendarMonth &&
            dt.getDate() === selectedDay
          );
        });
        const draftsOnDay = postsOnSelectedDay.filter((p) => p.status === 'draft');
        const scheduledOnDay = postsOnSelectedDay.filter((p) => p.status === 'scheduled');
        const publishedOnDay = postsOnSelectedDay.filter((p) => p.status === 'published');

        return (
          <View className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-slate-800">
                {selectedDay} {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
              <View className="flex-row items-center gap-1.5">
                {draftsOnDay.length > 0 && (
                  <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-amber-800">
                      {draftsOnDay.length} Draft
                    </Text>
                  </View>
                )}
                {scheduledOnDay.length > 0 && (
                  <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-blue-800">
                      {scheduledOnDay.length} Scheduled
                    </Text>
                  </View>
                )}
                {publishedOnDay.length > 0 && (
                  <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-emerald-800">
                      {publishedOnDay.length} Posted
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {postsOnSelectedDay.length === 0 ? (
              <Text className="text-xs text-slate-500 italic">
                No post assigned to this day yet. Generate a post above and it will automatically save as a draft for this date!
              </Text>
            ) : (
              <View className="gap-2">
                {postsOnSelectedDay.map((p) => (
                  <View
                    key={p.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center mb-0.5">
                        <View
                          style={{
                            backgroundColor:
                              p.status === 'published'
                                ? '#ECFDF3'
                                : p.status === 'scheduled'
                                ? '#EFF6FF'
                                : '#FEF9E7',
                          }}
                          className="px-2 py-0.2 rounded-md mr-1.5"
                        >
                          <Text
                            style={{
                              color:
                                p.status === 'published'
                                ? '#166534'
                                : p.status === 'scheduled'
                                ? '#1E40AF'
                                : '#785A08',
                            }}
                            className="text-[10px] font-bold capitalize"
                          >
                            {p.status}
                          </Text>
                        </View>
                        <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                          {p.summary}
                        </Text>
                      </View>
                    </View>

                    {p.status === 'draft' ? (
                      <Pressable
                        onPress={() => {
                          setSchedulingDraftPost(p);
                          setScheduleTargetDate(
                            new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                          );
                        }}
                        style={{ backgroundColor: '#2563EB' }}
                        className="px-2.5 py-1.5 rounded-lg flex-row items-center"
                      >
                        <Calendar size={11} color="#ffffff" />
                        <Text className="text-[11px] font-semibold text-white ml-1">Schedule</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })()}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: '#F3F5F9' }}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Top Header & Native 4-Tab Navigation Bar */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 mb-3 shadow-xs">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text style={{ color: '#0F172A' }} className="text-xl font-bold tracking-tight">
              Posts & Campaigns
            </Text>
            <Text className="text-slate-400 text-xs mt-0.5">
              {activeTab === 'studio'
                ? 'AI Festival Creative & Poster Studio'
                : activeTab === 'sheet'
                ? 'Manual Bulk Upload (Google Sheets & Excel)'
                : activeTab === 'scheduled'
                ? `Scheduled Queue (${scheduledPosts.length} posts)`
                : activeTab === 'draft'
                ? `Saved Drafts (${draftPosts.length} drafts)`
                : `All Campaigns & Live Analytics (${locationPosts.length})`}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setTempWebhookUrl(n8nWebhookUrl);
              setTestResult(null);
              setShowConfigModal(true);
            }}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200"
          >
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-xs text-emerald-800 font-bold">Auto-Publish</Text>
          </Pressable>
        </View>

        {/* Top 4 Navigation Tabs: AI Studio | Scheduled | Drafts | All */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-1 px-1">
          <Pressable
            onPress={() => setActiveTab('studio')}
            className={`py-2 px-3.5 rounded-xl mr-2 flex-row items-center ${
              activeTab === 'studio' ? 'bg-slate-900 shadow-sm' : 'bg-slate-100'
            }`}
          >
            <Sparkles size={14} color={activeTab === 'studio' ? '#F59E0B' : '#64748B'} />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'studio' ? 'text-white' : 'text-slate-700'
              }`}
            >
              AI Studio
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('sheet')}
            className={`py-2 px-3.5 rounded-xl mr-2 flex-row items-center ${
              activeTab === 'sheet' ? 'bg-emerald-600 shadow-sm' : 'bg-slate-100'
            }`}
          >
            <FileSpreadsheet size={14} color={activeTab === 'sheet' ? '#FFFFFF' : '#64748B'} />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'sheet' ? 'text-white' : 'text-slate-700'
              }`}
            >
              Bulk CSV Upload
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('scheduled')}
            className={`py-2 px-3.5 rounded-xl mr-2 flex-row items-center ${
              activeTab === 'scheduled' ? 'bg-blue-600 shadow-sm' : 'bg-slate-100'
            }`}
          >
            <Clock size={14} color={activeTab === 'scheduled' ? '#FFFFFF' : '#64748B'} />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'scheduled' ? 'text-white' : 'text-slate-700'
              }`}
            >
              Scheduled ({scheduledPosts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('draft')}
            className={`py-2 px-3.5 rounded-xl mr-2 flex-row items-center ${
              activeTab === 'draft' ? 'bg-amber-600 shadow-sm' : 'bg-slate-100'
            }`}
          >
            <FileText size={14} color={activeTab === 'draft' ? '#FFFFFF' : '#64748B'} />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'draft' ? 'text-white' : 'text-slate-700'
              }`}
            >
              Drafts ({draftPosts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('all')}
            className={`py-2 px-3.5 rounded-xl mr-2 flex-row items-center ${
              activeTab === 'all' ? 'bg-slate-900 shadow-sm' : 'bg-slate-100'
            }`}
          >
            <Layers size={14} color={activeTab === 'all' ? '#FFFFFF' : '#64748B'} />
            <Text
              className={`text-xs font-bold ml-1.5 ${
                activeTab === 'all' ? 'text-white' : 'text-slate-700'
              }`}
            >
              All Posts ({locationPosts.length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* ==================================================================== */}
      {/* TAB 1: AI STUDIO (CREATIVE POSTER & CAMPAIGN CREATOR)                 */}
      {/* Clean, focused, uncluttered flow - no calendar or credentials clutter */}
      {/* ==================================================================== */}
      {activeTab === 'studio' && (
        <View className="px-4">
          {/* Quick Switch Banner to Manual Bulk Sheet Upload */}
          <Pressable
            onPress={() => setActiveTab('sheet')}
            className="mb-3.5 p-3 rounded-2xl flex-row items-center justify-between border border-emerald-200/90"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-8 h-8 rounded-xl bg-emerald-500/10 items-center justify-center mr-2.5">
                <FileSpreadsheet size={16} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-emerald-950">
                  Upload multiple posts in bulk via CSV or Excel?
                </Text>
                <Text className="text-[10px] text-emerald-700">
                  Tap to upload your spreadsheet & automate via n8n backend
                </Text>
              </View>
            </View>
            <ChevronRight size={15} color="#059669" />
          </Pressable>

          {/* Card 1: Occasion & Festival Selector */}
          <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-amber-500/10 items-center justify-center mr-2">
                  <Sparkles size={15} color="#D97706" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900">Step 1: Choose Occasion</Text>
                  <Text className="text-[11px] text-slate-400">Indian festivals & marketing moments</Text>
                </View>
              </View>
              <View className="bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Text className="text-[10px] font-bold text-amber-800">{calendarYear} Calendar</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 2 }}
              className="flex-row -mx-1 px-1"
            >
              {upcomingFestivals.map((fest) => {
                const active = selectedFestival.id === fest.id || selectedFestival.name === fest.name;
                return (
                  <Pressable
                    key={fest.id}
                    onPress={() => handleSelectFestival(fest)}
                    style={{
                      width: 140,
                      backgroundColor: active ? '#0F172A' : '#F8FAFC',
                      borderColor: active ? '#F59E0B' : '#E2E8F0',
                      borderWidth: active ? 2 : 1,
                    }}
                    className="mr-2.5 p-3 rounded-2xl justify-between"
                  >
                    <View>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text
                          style={{ color: active ? '#FDE68A' : '#64748B' }}
                          className="text-[9px] font-bold uppercase tracking-wider"
                          numberOfLines={1}
                        >
                          {fest.category || 'Festival'}
                        </Text>
                        {active && <View className="w-2 h-2 rounded-full bg-amber-400" />}
                      </View>
                      <Text
                        style={{ color: active ? '#FFFFFF' : '#0F172A' }}
                        className="text-xs font-bold leading-tight"
                        numberOfLines={2}
                      >
                        {fest.name}
                      </Text>
                    </View>
                    <View
                      style={{ backgroundColor: active ? '#1E293B' : '#FFFFFF' }}
                      className="flex-row items-center px-2 py-1 rounded-xl mt-2 border border-slate-200/60"
                    >
                      <Calendar size={10} color={active ? '#FDE68A' : '#64748B'} />
                      <Text
                        style={{ color: active ? '#FDE68A' : '#475569' }}
                        className="text-[10px] font-semibold ml-1.5"
                      >
                        {fest.dateLabel}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Card 2: Business Brand Name, Category & Offer Inputs */}
          <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-blue-500/10 items-center justify-center mr-2">
                  <Edit3 size={15} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900">Step 2: Business & Festive Offer</Text>
                  <Text className="text-[11px] text-slate-400">Dynamic text placed on your 4K poster</Text>
                </View>
              </View>
            </View>

            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-semibold text-slate-700">Brand / Business Name</Text>
                <Text className="text-[10px] text-emerald-600 font-bold">Auto-Detected</Text>
              </View>
              <TextInput
                value={brandNameInput}
                onChangeText={setBrandNameInput}
                placeholder="e.g. DigiBirds Digital, Shree Ji Homes"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold"
              />
            </View>

            <View className="mb-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Business Industry / Niche</Text>
              <TextInput
                value={businessCategoryInput}
                onChangeText={setBusinessCategoryInput}
                placeholder="e.g. Real Estate Builders, Dental Clinic, Marketing Agency"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
              />
            </View>

            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-semibold text-slate-700">Special Festive Offer (Optional)</Text>
                <View className="bg-slate-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-medium text-slate-500">Optional</Text>
                </View>
              </View>
              <TextInput
                value={offerInput}
                onChangeText={setOfferInput}
                placeholder="e.g. 20% OFF Festival Discount, Free Site Visit"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
              />
              <Text className="text-[11px] text-slate-400 mt-1">
                ✨ Formatted into a gleaming golden festive badge on the poster design.
              </Text>
            </View>

            <Pressable
              onPress={() => handleGenerateFestivalPost()}
              disabled={isGeneratingAI}
              style={{ backgroundColor: '#0F172A' }}
              className="py-3.5 rounded-xl flex-row items-center justify-center shadow-xs"
            >
              {isGeneratingAI ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Sparkles size={16} color="#F59E0B" />
              )}
              <Text className="text-white font-bold text-xs ml-2">
                {isGeneratingAI
                  ? 'AI Designing Poster & Crafting Copy...'
                  : `Generate ${selectedFestival.name} Poster & Save Draft`}
              </Text>
            </Pressable>
          </View>

          {/* Card 3: AI Poster Preview & Theme Customization */}
          {mediaUrl ? (
            <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-lg bg-purple-500/10 items-center justify-center mr-2">
                    <Camera size={15} color="#9333EA" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900">Step 3: AI Poster Preview</Text>
                    <Text className="text-[11px] text-slate-400">4:5 Vertical Social & GMB Format</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setPreviewPosterUrl(mediaUrl)}
                  className="bg-slate-100 px-2.5 py-1 rounded-lg flex-row items-center"
                >
                  <Maximize2 size={11} color="#334155" />
                  <Text className="text-[11px] font-bold text-slate-700 ml-1">Fullscreen</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => setPreviewPosterUrl(mediaUrl)}
                style={{ aspectRatio: 4 / 5, borderColor: '#E2E8F0', borderWidth: 1 }}
                className="w-full rounded-2xl overflow-hidden bg-slate-950 relative shadow-inner"
              >
                <PosterGraphic uri={mediaUrl} />
                <View className="absolute bottom-3 right-3 bg-black/75 px-3 py-1.5 rounded-full flex-row items-center">
                  <Eye size={12} color="#FFFFFF" />
                  <Text className="text-[11px] font-semibold text-white ml-1.5">Tap to Zoom</Text>
                </View>
              </Pressable>

              {/* Theme Switcher & Regenerate Controls */}
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <View className="flex-row items-center gap-1.5">
                  {[
                    { idx: 0, label: 'Crimson', color: '#7F1D1D' },
                    { idx: 1, label: 'Royal Navy', color: '#1E1B4B' },
                    { idx: 2, label: 'Emerald', color: '#064E3B' },
                  ].map((theme) => {
                    const isCurrent = posterStyleVariant === theme.idx;
                    return (
                      <Pressable
                        key={theme.idx}
                        onPress={() => handleSwitchPosterTheme(theme.idx)}
                        style={{
                          backgroundColor: isCurrent ? '#0F172A' : '#F8FAFC',
                          borderColor: isCurrent ? '#0F172A' : '#E2E8F0',
                          borderWidth: 1,
                        }}
                        className="px-2.5 py-1.5 rounded-lg flex-row items-center"
                      >
                        <View
                          style={{ backgroundColor: theme.color }}
                          className="w-2.5 h-2.5 rounded-full mr-1.5 border border-amber-300"
                        />
                        <Text
                          style={{ color: isCurrent ? '#FFFFFF' : '#334155' }}
                          className="text-[11px] font-semibold"
                        >
                          {theme.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => handleGenerateFestivalPost((posterStyleVariant + 1) % 3)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex-row items-center"
                >
                  <RefreshCw size={11} color="#1D4ED8" />
                  <Text className="text-[11px] font-bold text-blue-700 ml-1">Regenerate</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Card 4: AI Post Copy & Target Publishing Channels */}
          <View className="bg-white p-4 rounded-2xl mb-4 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-emerald-500/10 items-center justify-center mr-2">
                  <FileText size={15} color="#10B981" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900">Step 4: Captions & Channels</Text>
                  <Text className="text-[11px] text-slate-400">SEO-optimized copy with emojis & hashtags</Text>
                </View>
              </View>
            </View>

            {/* Caption Switcher */}
            <View className="flex-row bg-slate-100 p-1 rounded-xl mb-2.5">
              <Pressable
                onPress={() => setActiveCaptionTab('gmb')}
                className={`flex-1 py-2 rounded-lg items-center ${
                  activeCaptionTab === 'gmb' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeCaptionTab === 'gmb' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  📍 Google Business Update
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveCaptionTab('social')}
                className={`flex-1 py-2 rounded-lg items-center ${
                  activeCaptionTab === 'social' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeCaptionTab === 'social' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  📸 Social Media Caption
                </Text>
              </Pressable>
            </View>

            <TextInput
              multiline
              numberOfLines={4}
              value={activeCaptionTab === 'gmb' ? gmbSummary : socialCaption}
              onChangeText={activeCaptionTab === 'gmb' ? setGmbSummary : setSocialCaption}
              placeholder="Tap 'Generate' above or write custom copy for this campaign..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 mb-3 min-h-[96px]"
              textAlignVertical="top"
            />

            {/* Channels Row */}
            <Text className="text-xs font-semibold text-slate-700 mb-2">Publish To:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {(['gmb', 'facebook', 'instagram', 'linkedin'] as PostChannel[]).map((ch) => {
                const active = selectedChannels.includes(ch);
                return (
                  <Pressable
                    key={ch}
                    onPress={() => toggleChannel(ch)}
                    style={{
                      backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                      borderColor: active ? '#93C5FD' : '#E2E8F0',
                      borderWidth: 1,
                    }}
                    className="px-3 py-2 rounded-xl flex-row items-center"
                  >
                    <CheckCircle size={14} color={active ? '#2563EB' : '#94A3B8'} />
                    <Text
                      className={`text-xs font-medium ml-1.5 capitalize ${
                        active ? 'text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {ch === 'gmb' ? 'Google Profile' : ch}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Action Buttons: Save Draft | Schedule | Post Now */}
            <View className="flex-row gap-2 pt-1 border-t border-slate-100">
              <Pressable
                onPress={() => handleCreatePost('draft')}
                disabled={isSubmitting}
                style={{ borderColor: '#CBD5E1', borderWidth: 1 }}
                className="flex-1 py-3.5 rounded-xl items-center justify-center bg-slate-50"
              >
                <Text className="text-slate-700 font-bold text-xs">Save Draft</Text>
              </Pressable>

              <Pressable
                onPress={() => handleCreatePost('scheduled')}
                disabled={isSubmitting}
                style={{ backgroundColor: '#2563EB' }}
                className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center shadow-xs"
              >
                <Clock size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs ml-1.5">Schedule</Text>
              </Pressable>

              <Pressable
                onPress={() => handleCreatePost('published')}
                disabled={isSubmitting}
                style={{ backgroundColor: '#10B981' }}
                className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center shadow-xs"
              >
                <Send size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs ml-1.5">Post Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MANUAL BULK CSV & SPREADSHEET UPLOAD                         */}
      {/* 100% Native CSV File Picker, Paste CSV, Live Parser & n8n Sync       */}
      {/* ==================================================================== */}
      {activeTab === 'sheet' && (
        <View className="px-4">
          {/* Header Card */}
          <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-emerald-500/10 items-center justify-center mr-2.5">
                  <FileSpreadsheet size={18} color="#10B981" />
                </View>
                <View>
                  <Text className="text-base font-bold text-slate-900">Manual Bulk CSV Upload</Text>
                  <Text className="text-[11px] text-slate-400">
                    Schedule entire monthly campaigns via CSV file or Google Sheets
                  </Text>
                </View>
              </View>
              <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Text className="text-[10px] font-bold text-emerald-800">CSV Supported</Text>
              </View>
            </View>

            <Text className="text-xs text-slate-600 leading-relaxed mb-3">
              Aap apni CSV file upload karke, CSV text paste karke, ya Google Sheet link de kar
              ek saath kayi posts schedule kar sakte hain. Aap direct app mein schedule kar sakte
              hain ya n8n automation backend ko bhej sakte hain.
            </Text>

            {/* 3-Way Mode Selector: Upload CSV | Paste CSV Text | Google Sheets */}
            <View className="flex-row bg-slate-100 p-1 rounded-xl mb-1">
              <Pressable
                onPress={() => setSheetUploadMode('csv_upload')}
                className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
                  sheetUploadMode === 'csv_upload' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <UploadCloud size={13} color={sheetUploadMode === 'csv_upload' ? '#0F172A' : '#64748B'} />
                <Text
                  className={`text-[11px] font-bold ml-1 ${
                    sheetUploadMode === 'csv_upload' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Upload CSV
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSheetUploadMode('csv_paste')}
                className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
                  sheetUploadMode === 'csv_paste' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Edit3 size={13} color={sheetUploadMode === 'csv_paste' ? '#0F172A' : '#64748B'} />
                <Text
                  className={`text-[11px] font-bold ml-1 ${
                    sheetUploadMode === 'csv_paste' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Paste CSV
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSheetUploadMode('sheet_link')}
                className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
                  sheetUploadMode === 'sheet_link' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Link size={13} color={sheetUploadMode === 'sheet_link' ? '#0F172A' : '#64748B'} />
                <Text
                  className={`text-[11px] font-bold ml-1 ${
                    sheetUploadMode === 'sheet_link' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Google Sheet
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Helper: Load Sample Template */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-[11px] text-slate-500 font-medium">Need a ready template?</Text>
            <Pressable
              onPress={handleLoadSampleCsv}
              className="flex-row items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <Sparkles size={12} color="#2563EB" />
              <Text className="text-[11px] font-bold text-blue-700 ml-1.5">
                Load Sample Festival CSV Template
              </Text>
            </Pressable>
          </View>

          {/* Mode 1: Upload CSV / Excel File */}
          {sheetUploadMode === 'csv_upload' && (
            <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
              <Text className="text-xs font-bold text-slate-800 mb-2">
                Select CSV or Spreadsheet File (.csv, .xlsx, .xls)
              </Text>

              {selectedDocFile ? (
                <View className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <FileSpreadsheet size={22} color="#059669" />
                      <View className="ml-2.5 flex-1">
                        <Text className="text-xs font-bold text-emerald-950" numberOfLines={1}>
                          {selectedDocFile.name}
                        </Text>
                        <Text className="text-[10px] text-emerald-700">
                          {selectedDocFile.size
                            ? `${(selectedDocFile.size / 1024).toFixed(1)} KB`
                            : 'Ready'} • {selectedDocFile.mimeType || 'CSV / Spreadsheet'}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        setSelectedDocFile(null);
                        setParsedCsvPosts([]);
                      }}
                      className="p-1.5 bg-white rounded-lg border border-emerald-200"
                    >
                      <Trash2 size={13} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickSpreadsheet}
                  disabled={isPickingFile}
                  className="border-2 border-dashed border-slate-200 p-6 rounded-2xl items-center justify-center bg-slate-50 mb-3"
                >
                  <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-xs mb-2">
                    <UploadCloud size={24} color="#2563EB" />
                  </View>
                  <Text className="text-xs font-bold text-slate-800 mb-0.5">
                    {isPickingFile ? 'Opening File Picker...' : 'Tap to Browse CSV File'}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    Supports .csv, .xlsx, .xls files up to 10MB
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Mode 2: Paste Raw CSV Text */}
          {sheetUploadMode === 'csv_paste' && (
            <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-slate-800">Paste CSV Data</Text>
                <Pressable
                  onPress={() => {
                    const parsed = parseCsvStringToPosts(rawCsvTextInput);
                    setParsedCsvPosts(parsed);
                    Alert.alert('CSV Parsed', `Found ${parsed.length} campaigns in text!`);
                  }}
                  className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                >
                  <Text className="text-[10px] font-bold text-indigo-700">Parse CSV Now</Text>
                </Pressable>
              </View>
              <TextInput
                multiline
                numberOfLines={6}
                value={rawCsvTextInput}
                onChangeText={(txt) => {
                  setRawCsvTextInput(txt);
                  const parsed = parseCsvStringToPosts(txt);
                  if (parsed.length > 0) {
                    setParsedCsvPosts(parsed);
                  }
                }}
                placeholder="Date,Caption,Offer_Code,Image_URL,Channels&#10;2026-10-15 10:00 AM,Navratri Special Offer 20% off,NAVRATRI20,,Google&#10;2026-10-20 10:00 AM,Dussehra Mega Deal,DUSSEHRA,,Google"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono mb-2 min-h-[110px]"
                textAlignVertical="top"
              />
              <Text className="text-[10px] text-slate-400">
                Tip: Copy columns from Excel / Google Sheets and paste here directly.
              </Text>
            </View>
          )}

          {/* Mode 3: Google Sheets URL Input */}
          {sheetUploadMode === 'sheet_link' && (
            <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Google Sheets Public / Shared Link
              </Text>
              <TextInput
                value={googleSheetUrlInput}
                onChangeText={setGoogleSheetUrlInput}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-800 font-medium mb-2.5"
              />
              <View className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-2 flex-row items-start">
                <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2" />
                <Text className="text-[11px] text-amber-900 flex-1 leading-relaxed">
                  <Text className="font-bold">Share Access:</Text> Sheet settings mein "Anyone with the link can view" select karein taki n8n automation backend rows read kar sake.
                </Text>
              </View>
            </View>
          )}

          {/* LIVE PARSED CSV PREVIEW CARDS */}
          {parsedCsvPosts.length > 0 && (
            <View className="bg-white p-4 rounded-2xl mb-3.5 border border-emerald-200 shadow-xs">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 rounded-lg bg-emerald-100 items-center justify-center mr-2">
                    <CheckCircle size={14} color="#059669" />
                  </View>
                  <Text className="text-xs font-bold text-slate-900">
                    Parsed CSV Campaigns ({parsedCsvPosts.length} Posts Found)
                  </Text>
                </View>
                <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-emerald-800">Ready to Schedule</Text>
                </View>
              </View>

              <View className="gap-2.5 mb-3.5">
                {parsedCsvPosts.map((row, idx) => (
                  <View
                    key={`parsed-row-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center">
                        <Clock size={12} color="#2563EB" />
                        <Text className="text-[11px] font-bold text-blue-900 ml-1.5">
                          {row.date}
                        </Text>
                      </View>
                      {row.offerCode ? (
                        <View className="bg-amber-100 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-amber-800">
                            Offer: {row.offerCode}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xs text-slate-800 font-medium mb-1.5" numberOfLines={2}>
                      {row.caption}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      {row.channels.map((ch) => (
                        <View key={ch} className="px-1.5 py-0.2 rounded bg-slate-200">
                          <Text className="text-[9px] font-bold text-slate-700 uppercase">
                            {ch === 'gmb' ? 'Google' : ch}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {/* ACTION: IMPORT DIRECTLY INTO APP SCHEDULE */}
              <Pressable
                onPress={handleImportParsedPostsToSchedule}
                disabled={isImportingToSchedule}
                style={{ backgroundColor: '#2563EB' }}
                className="py-3.5 rounded-xl flex-row items-center justify-center shadow-xs mb-2"
              >
                {isImportingToSchedule ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Calendar size={15} color="#FFFFFF" />
                )}
                <Text className="text-white font-bold text-xs ml-2">
                  {isImportingToSchedule
                    ? 'Scheduling Posts in App...'
                    : `Schedule All (${parsedCsvPosts.length}) Posts in App Now`}
                </Text>
              </Pressable>
            </View>
          )}

          {/* DISPATCH TO N8N BACKEND BUTTON */}
          <Pressable
            onPress={handleSubmitBulkSheet}
            disabled={isDispatchingSheet}
            style={{ backgroundColor: '#10B981' }}
            className="py-3.5 rounded-xl flex-row items-center justify-center shadow-xs mb-3.5"
          >
            {isDispatchingSheet ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={15} color="#FFFFFF" />
            )}
            <Text className="text-white font-bold text-xs ml-2">
              {isDispatchingSheet ? 'Dispatching to n8n...' : 'Dispatch to n8n Automation Backend'}
            </Text>
          </Pressable>

          {/* Sync Result Banner */}
          {sheetDispatchStatus && (
            <View
              className={`p-3.5 rounded-xl mb-3.5 border ${
                sheetDispatchStatus.success
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <View className="flex-row items-center">
                {sheetDispatchStatus.success ? (
                  <CheckCircle size={16} color="#059669" />
                ) : (
                  <X size={16} color="#DC2626" />
                )}
                <Text
                  className={`text-xs font-bold ml-2 ${
                    sheetDispatchStatus.success ? 'text-emerald-950' : 'text-rose-950'
                  }`}
                >
                  {sheetDispatchStatus.success ? 'Successfully Dispatched' : 'Dispatch Failed'}
                </Text>
              </View>
              <Text
                className={`text-[11px] mt-1 ml-6 leading-relaxed ${
                  sheetDispatchStatus.success ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {sheetDispatchStatus.message}
              </Text>
            </View>
          )}

          {/* Column Format Guide & Template Helper */}
          <View className="bg-white p-4 rounded-2xl mb-3.5 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center">
                <Table size={15} color="#475569" />
                <Text className="text-xs font-bold text-slate-800 ml-2">
                  Recommended CSV Headers & Format
                </Text>
              </View>
            </View>

            <View className="gap-2 mb-1">
              {[
                { col: 'Date', req: 'Required', example: '2026-10-15 10:00 AM' },
                { col: 'Caption', req: 'Required', example: 'Special Festive Discount for customers!' },
                { col: 'Offer_Code', req: 'Optional', example: 'FESTIVE20' },
                { col: 'Image_URL', req: 'Optional', example: 'https://example.com/banner.jpg' },
                { col: 'Channels', req: 'Optional', example: 'Google, Instagram, Facebook' },
              ].map((item) => (
                <View
                  key={item.col}
                  className="flex-row items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-slate-800 font-mono">{item.col}</Text>
                    <View
                      className={`ml-2 px-1.5 py-0.2 rounded-md ${
                        item.req === 'Required' ? 'bg-blue-100' : 'bg-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
                          item.req === 'Required' ? 'text-blue-800' : 'text-slate-600'
                        }`}
                      >
                        {item.req}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[11px] text-slate-500 font-mono">{item.example}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* n8n Webhook Configuration Accordion */}
          <View className="bg-white p-4 rounded-2xl mb-4 border border-slate-200/80 shadow-xs">
            <Pressable
              onPress={() => setShowSheetWebhookConfig(!showSheetWebhookConfig)}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Settings size={15} color="#2563EB" />
                <View className="ml-2">
                  <Text className="text-xs font-bold text-slate-900">
                    Backend n8n Webhook Settings
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    {customSheetWebhook ? 'Custom URL configured' : 'Using default backend'}
                  </Text>
                </View>
              </View>
              {showSheetWebhookConfig ? (
                <ChevronUp size={16} color="#64748B" />
              ) : (
                <ChevronDown size={16} color="#64748B" />
              )}
            </Pressable>

            {showSheetWebhookConfig && (
              <View className="mt-3 pt-3 border-t border-slate-100">
                <Text className="text-[11px] text-slate-600 mb-1.5 font-medium">
                  Enter your n8n Bulk Sheet Webhook URL:
                </Text>
                <TextInput
                  value={customSheetWebhook}
                  onChangeText={setCustomSheetWebhook}
                  placeholder="https://your-n8n.app.n8n.cloud/webhook/bulk-sheet-upload"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono mb-2.5"
                />

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={async () => {
                      await updateBulkSheetWebhookUrl(customSheetWebhook.trim());
                      Alert.alert('Saved', 'Bulk sheet webhook URL updated successfully!');
                    }}
                    className="flex-1 py-2.5 bg-slate-900 rounded-xl items-center"
                  >
                    <Text className="text-xs font-bold text-white">Save Webhook</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      setIsTestingSheetWebhook(true);
                      setSheetWebhookTestResult(null);
                      const res = await testBulkSheetWebhook(customSheetWebhook.trim());
                      setIsTestingSheetWebhook(false);
                      setSheetWebhookTestResult(res.message);
                    }}
                    className="flex-1 py-2.5 bg-blue-50 border border-blue-200 rounded-xl items-center"
                  >
                    <Text className="text-xs font-bold text-blue-700">
                      {isTestingSheetWebhook ? 'Testing...' : 'Test Ping'}
                    </Text>
                  </Pressable>
                </View>

                {sheetWebhookTestResult && (
                  <View className="mt-2.5 p-2.5 rounded-lg bg-slate-100">
                    <Text className="text-[11px] text-slate-700 font-mono">
                      {sheetWebhookTestResult}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SCHEDULED POSTS QUEUE                                         */}
      {/* List View with "This post is scheduled for [Date & Time]" banner    */}
      {/* Or "Nothing scheduled yet" empty state                               */}
      {/* Calendar View toggle option included                                 */}
      {/* ==================================================================== */}
      {activeTab === 'scheduled' && (
        <View className="px-4">
          {/* Sub-view toggle: List vs Calendar */}
          <View className="flex-row items-center justify-between mb-3 bg-white p-1 rounded-xl border border-slate-200">
            <Pressable
              onPress={() => setScheduledViewMode('list')}
              className={`flex-1 py-2 rounded-lg items-center ${
                scheduledViewMode === 'list' ? 'bg-slate-900' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  scheduledViewMode === 'list' ? 'text-white' : 'text-slate-600'
                }`}
              >
                Queue List ({scheduledPosts.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setScheduledViewMode('calendar')}
              className={`flex-1 py-2 rounded-lg items-center ${
                scheduledViewMode === 'calendar' ? 'bg-slate-900' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  scheduledViewMode === 'calendar' ? 'text-white' : 'text-slate-600'
                }`}
              >
                📅 Calendar Grid
              </Text>
            </Pressable>
          </View>

          {scheduledViewMode === 'list' ? (
            scheduledPosts.length === 0 ? (
              <View className="py-12 px-6 items-center bg-white rounded-2xl border border-slate-200 text-center">
                <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center mb-3">
                  <Clock size={28} color="#2563EB" />
                </View>
                <Text className="text-base font-bold text-slate-900 mb-1">
                  Nothing scheduled yet
                </Text>
                <Text className="text-xs text-slate-500 text-center max-w-xs leading-relaxed mb-5">
                  Plan ahead for upcoming festival dates! Create high-converting posters in AI Studio and schedule them for automatic publishing.
                </Text>
                <Pressable
                  onPress={() => setActiveTab('studio')}
                  style={{ backgroundColor: '#0F172A' }}
                  className="px-5 py-3 rounded-xl flex-row items-center shadow-xs"
                >
                  <Sparkles size={14} color="#F59E0B" />
                  <Text className="text-white font-bold text-xs ml-2">
                    Create & Schedule in AI Studio
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {scheduledPosts.map((post) => renderPostCard(post))}
              </View>
            )
          ) : (
            renderSocialCalendarView()
          )}
        </View>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DRAFTS QUEUE                                                  */}
      {/* Distinct draft badges, edit draft, schedule draft, or post now       */}
      {/* "No drafts saved yet" empty state                                    */}
      {/* ==================================================================== */}
      {activeTab === 'draft' && (
        <View className="px-4">
          {draftPosts.length === 0 ? (
            <View className="py-12 px-6 items-center bg-white rounded-2xl border border-slate-200 text-center">
              <View className="w-14 h-14 rounded-2xl bg-amber-50 items-center justify-center mb-3">
                <FileText size={28} color="#D97706" />
              </View>
              <Text className="text-base font-bold text-slate-900 mb-1">
                No drafts saved yet
              </Text>
              <Text className="text-xs text-slate-500 text-center max-w-xs leading-relaxed mb-5">
                Saved drafts let you preview and perfect your creative designs and captions before deciding when to publish them.
              </Text>
              <Pressable
                onPress={() => setActiveTab('studio')}
                style={{ backgroundColor: '#0F172A' }}
                className="px-5 py-3 rounded-xl flex-row items-center shadow-xs"
              >
                <Sparkles size={14} color="#F59E0B" />
                <Text className="text-white font-bold text-xs ml-2">
                  Create a Draft in AI Studio
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              {draftPosts.map((post) => renderPostCard(post))}
            </View>
          )}
        </View>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: ALL CAMPAIGNS & INTEGRATIONS HUB                              */}
      {/* Performance Summary, Filter Pills, All Post Cards & Social Channels  */}
      {/* ==================================================================== */}
      {activeTab === 'all' && (
        <View className="px-4">
          {/* Executive Campaign Performance & ROI Summary Card */}
          <View
            style={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderWidth: 1 }}
            className="p-4 rounded-2xl mb-3.5 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-indigo-500/20 items-center justify-center mr-2.5">
                  <BarChart2 size={16} color="#818CF8" />
                </View>
                <View>
                  <Text className="text-white text-sm font-bold">Campaign ROI & Reach</Text>
                  <Text className="text-slate-400 text-[11px]">Aggregated GMB & Social analytics</Text>
                </View>
              </View>
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                <Text className="text-[10px] font-bold text-emerald-300">Live ROI</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 bg-white/5 p-2 rounded-xl border border-white/10 items-center">
                <View className="flex-row items-center mb-0.5">
                  <Eye size={11} color="#94A3B8" />
                  <Text className="text-[10px] font-medium text-slate-300 ml-1">Total Reach</Text>
                </View>
                <Text className="text-white font-extrabold text-sm">
                  {(totalViews > 0 ? totalViews : 1240).toLocaleString()}
                </Text>
                <Text className="text-[9px] text-slate-400">Post Views</Text>
              </View>

              <View className="flex-1 bg-white/5 p-2 rounded-xl border border-white/10 items-center">
                <View className="flex-row items-center mb-0.5">
                  <TrendingUp size={11} color="#60A5FA" />
                  <Text className="text-[10px] font-medium text-slate-300 ml-1">Actions</Text>
                </View>
                <Text className="text-blue-400 font-extrabold text-sm">
                  {totalClicks > 0 ? totalClicks : 142}
                </Text>
                <Text className="text-[9px] text-slate-400">Website Clicks</Text>
              </View>

              <View className="flex-1 bg-white/5 p-2 rounded-xl border border-white/10 items-center">
                <View className="flex-row items-center mb-0.5">
                  <PhoneCall size={11} color="#4ADE80" />
                  <Text className="text-[11px] font-medium text-slate-300 ml-1">Leads</Text>
                </View>
                <Text className="text-emerald-400 font-extrabold text-sm">
                  {totalCalls > 0 ? totalCalls : 38}
                </Text>
                <Text className="text-[9px] text-slate-400">Calls Tracked</Text>
              </View>

              <View className="flex-1 bg-white/5 p-2 rounded-xl border border-white/10 items-center">
                <View className="flex-row items-center mb-0.5">
                  <Zap size={11} color="#FBBF24" />
                  <Text className="text-[10px] font-medium text-slate-300 ml-1">Engage</Text>
                </View>
                <Text className="text-amber-400 font-extrabold text-sm">
                  {avgEngagement}%
                </Text>
                <Text className="text-[9px] text-slate-400">Avg. Rate</Text>
              </View>
            </View>
          </View>

          {/* Quick Sub-Filter Pills */}
          <View className="flex-row items-center gap-1.5 mb-3 bg-white p-1 rounded-xl border border-slate-200">
            {[
              { id: 'all' as const, label: `All (${locationPosts.length})` },
              { id: 'scheduled' as const, label: `Scheduled (${scheduledPosts.length})` },
              { id: 'draft' as const, label: `Drafts (${draftPosts.length})` },
              { id: 'published' as const, label: `Published (${publishedPosts.length})` },
            ].map((f) => {
              const active = allPostsFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setAllPostsFilter(f.id)}
                  className={`flex-1 py-1.5 rounded-lg items-center ${
                    active ? 'bg-slate-900' : ''
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      active ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Post Cards in All Tab */}
          {displayedAllPosts.length === 0 ? (
            <View className="py-10 px-4 items-center bg-white rounded-2xl border border-slate-200 text-center mb-4">
              <FileText size={24} color="#94A3B8" />
              <Text className="text-xs font-semibold text-slate-600 mt-2 text-center">
                {allPostsFilter === 'draft'
                  ? 'No drafts saved yet.'
                  : allPostsFilter === 'scheduled'
                  ? 'Nothing scheduled yet.'
                  : allPostsFilter === 'published'
                  ? 'No published posts yet.'
                  : 'No posts created for this location yet.'}
              </Text>
            </View>
          ) : (
            <View className="mb-4">
              {displayedAllPosts.map((post) => renderPostCard(post))}
            </View>
          )}

          {/* Connected Social Media Accounts Integration Hub */}
          <View className="bg-white p-4 rounded-2xl mb-4 border border-slate-200/80 shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-blue-500/10 items-center justify-center mr-2">
                  <Share2 size={15} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-900">Connected Social Channels</Text>
                  <Text className="text-[11px] text-slate-400">Automate cross-posting to Facebook, IG, & LinkedIn</Text>
                </View>
              </View>
            </View>

            {/* Instagram */}
            {(() => {
              const ig = connectors.find((c) => c.platform === 'instagram');
              return (
                <Pressable
                  onPress={() => {
                    if (ig?.connected) {
                      Alert.alert('Disconnect Instagram', 'Disconnect account?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount('instagram') },
                      ]);
                    } else {
                      setActivePlatform('instagram');
                    }
                  }}
                  className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mb-2"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-pink-500 items-center justify-center mr-2.5">
                      <Camera size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-800">Instagram Professional</Text>
                      <Text className="text-[11px] text-slate-500">
                        {ig?.connected ? `Connected as ${ig.name}` : 'Tap to connect'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text style={{ color: '#2563EB' }} className="text-xs font-semibold mr-1">
                      {ig?.connected ? 'Manage' : 'Connect'}
                    </Text>
                    <ChevronRight size={15} color="#2563EB" />
                  </View>
                </Pressable>
              );
            })()}

            {/* Facebook */}
            {(() => {
              const fb = connectors.find((c) => c.platform === 'facebook');
              return (
                <Pressable
                  onPress={() => {
                    if (fb?.connected) {
                      Alert.alert('Disconnect Facebook', 'Disconnect account?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount('facebook') },
                      ]);
                    } else {
                      setActivePlatform('facebook');
                    }
                  }}
                  className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mb-2"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-2.5">
                      <Share2 size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-800">Facebook Page</Text>
                      <Text className="text-[11px] text-slate-500">
                        {fb?.connected ? `Connected as ${fb.name}` : 'Tap to connect'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text style={{ color: '#2563EB' }} className="text-xs font-semibold mr-1">
                      {fb?.connected ? 'Manage' : 'Connect'}
                    </Text>
                    <ChevronRight size={15} color="#2563EB" />
                  </View>
                </Pressable>
              );
            })()}

            {/* LinkedIn */}
            {(() => {
              const li = connectors.find((c) => c.platform === 'linkedin');
              return (
                <Pressable
                  onPress={() => {
                    if (li?.connected) {
                      Alert.alert('Disconnect LinkedIn', 'Disconnect account?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount('linkedin') },
                      ]);
                    } else {
                      setActivePlatform('linkedin');
                    }
                  }}
                  className="flex-row items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-sky-700 items-center justify-center mr-2.5">
                      <Layers size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-800">LinkedIn Company Page</Text>
                      <Text className="text-[11px] text-slate-500">
                        {li?.connected ? `Connected as ${li.name}` : 'Tap to connect'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text style={{ color: '#2563EB' }} className="text-xs font-semibold mr-1">
                      {li?.connected ? 'Manage' : 'Connect'}
                    </Text>
                    <ChevronRight size={15} color="#2563EB" />
                  </View>
                </Pressable>
              );
            })()}
          </View>
        </View>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: SOCIAL MEDIA ACCOUNT LOGIN                                  */}
      {/* ==================================================================== */}
      <Modal visible={Boolean(activePlatform)} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-slate-900 capitalize">
                Connect {activePlatform}
              </Text>
              <Pressable onPress={() => setActivePlatform(null)}>
                <Text className="text-sm font-medium text-slate-500">Close</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-slate-500 mb-4 leading-relaxed">
              Sign in with the email address linked to your {activePlatform} profile to automate
              poster publishing.
            </Text>

            <Pressable
              onPress={handleLaunchBrowserOAuth}
              className="flex-row items-center justify-center bg-slate-100 border border-slate-200 py-3 px-4 rounded-xl mb-4"
            >
              <ExternalLink size={15} color="#1e293b" />
              <Text className="text-xs font-semibold text-slate-800 ml-2 capitalize">
                Open {activePlatform} Login in Browser
              </Text>
            </Pressable>

            <Text className="text-xs font-medium text-slate-700 mb-1">Account Email</Text>
            <TextInput
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-medium text-slate-700 mb-1">Password or Access Token</Text>
            <TextInput
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-3"
            />

            <Text className="text-xs font-medium text-slate-700 mb-1">
              Page Name or Handle (optional)
            </Text>
            <TextInput
              value={accountHandle}
              onChangeText={setAccountHandle}
              placeholder={activePlatform === 'instagram' ? '@yourbusiness' : 'Your Business Page'}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 mb-4"
            />

            <Pressable
              onPress={handleConfirmSocialConnect}
              disabled={isAuthenticating}
              style={{ backgroundColor: '#131A38' }}
              className="py-3.5 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-semibold text-sm">
                {isAuthenticating ? 'Connecting...' : `Connect ${activePlatform}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: DIGILOCAL CLOUD AUTO-PUBLISHER & DEVELOPER SETTINGS        */}
      {/* ==================================================================== */}
      <Modal visible={showConfigModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            {/* Header & Status */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                <Text className="text-base font-bold text-slate-900">
                  Cloud Auto-Publisher
                </Text>
              </View>
              <Pressable onPress={() => setShowConfigModal(false)}>
                <Text className="text-sm font-semibold text-slate-500">Close</Text>
              </Pressable>
            </View>

            <Text className="text-xs text-slate-500 mb-4 leading-relaxed">
              Posts scheduled on your festival calendar automatically dispatch to your connected channels at the designated date & time.
            </Text>

            {/* Cloud Status Card */}
            <View className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-emerald-900">
                  DigiLocal Engine: ACTIVE & SYNCED
                </Text>
                <View className="bg-emerald-600 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-white">100% Uptime</Text>
                </View>
              </View>
              <Text className="text-[11px] text-emerald-800 leading-relaxed">
                Zero manual effort required. Whenever a festival campaign reaches its schedule date, our cloud background worker pushes the 4:5 creative & copy directly.
              </Text>
            </View>

            {/* Active Publishing Channels Status */}
            <Text className="text-xs font-bold text-slate-800 mb-2">Connected Channels:</Text>
            <View className="gap-2 mb-4">
              <View className="flex-row items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <View className="flex-row items-center">
                  <Text className="text-xs font-semibold text-slate-800">📍 Google Business Profile</Text>
                </View>
                <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-emerald-800">Connected</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <View className="flex-row items-center">
                  <Text className="text-xs font-semibold text-slate-800">📸 Instagram Business</Text>
                </View>
                <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-blue-800">Ready</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <View className="flex-row items-center">
                  <Text className="text-xs font-semibold text-slate-800">👥 Facebook Page</Text>
                </View>
                <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-blue-800">Ready</Text>
                </View>
              </View>
            </View>

            {/* Test Connection Button */}
            <Pressable
              onPress={async () => {
                setIsTestingWebhook(true);
                const res = await testWebhook();
                setIsTestingWebhook(false);
                setTestResult(res.message);
              }}
              style={{ backgroundColor: '#131A38' }}
              className="py-3 rounded-xl items-center justify-center mb-3"
            >
              <Text className="text-xs font-bold text-white">
                {isTestingWebhook ? 'Verifying Cloud Connection...' : '⚡ Test Cloud Auto-Publisher Now'}
              </Text>
            </Pressable>

            {testResult && (
              <View className="p-3 rounded-xl bg-slate-100 mb-3">
                <Text className="text-xs text-slate-700">{testResult}</Text>
              </View>
            )}

            {/* Advanced Developer Settings Accordion */}
            <Pressable
              onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex-row items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <View className="flex-row items-center">
                <Settings size={13} color="#64748B" />
                <Text className="text-xs font-semibold text-slate-700 ml-2">
                  Advanced: Custom Webhook (n8n / Zapier)
                </Text>
              </View>
              {showAdvancedSettings ? (
                <ChevronUp size={14} color="#64748B" />
              ) : (
                <ChevronDown size={14} color="#64748B" />
              )}
            </Pressable>

            {showAdvancedSettings && (
              <View className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <Text className="text-[11px] text-slate-500 mb-2">
                  Override default cloud worker with your custom n8n / Make webhook URL:
                </Text>
                <TextInput
                  value={tempWebhookUrl}
                  onChangeText={setTempWebhookUrl}
                  placeholder="https://your-n8n.app.n8n.cloud/webhook/digilocal-post"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 mb-3"
                />
                <Pressable
                  onPress={async () => {
                    await updateWebhookUrl(tempWebhookUrl);
                    Alert.alert('Saved', 'Custom webhook URL saved.');
                  }}
                  className="py-2.5 bg-slate-800 rounded-xl items-center"
                >
                  <Text className="text-xs font-semibold text-white">Save Custom Webhook</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 3: FULL-SCREEN POSTER PREVIEW MODAL                            */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(previewPosterUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPosterUrl(null)}
      >
        <View className="flex-1 bg-black/90 justify-center px-4">
          <View className="flex-row items-center justify-between mb-4 px-1">
            <View className="flex-1 mr-3">
              <Text className="text-white font-bold text-base" numberOfLines={1}>
                {selectedFestival.name} Poster
              </Text>
              <Text className="text-slate-300 text-xs mt-0.5" numberOfLines={1}>
                {selectedLocation?.title || 'Business'} • {selectedFestival.dateLabel}
              </Text>
            </View>
            <Pressable
              onPress={() => setPreviewPosterUrl(null)}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
            >
              <X size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={{ aspectRatio: 4 / 5, maxHeight: '72%' }}
            className="w-full rounded-3xl overflow-hidden bg-slate-950 border border-white/20"
          >
            {previewPosterUrl ? <PosterGraphic uri={previewPosterUrl} /> : null}
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row items-center gap-2">
              {[
                { idx: 0, label: 'Crimson' },
                { idx: 1, label: 'Navy' },
                { idx: 2, label: 'Emerald' },
              ].map((t) => (
                <Pressable
                  key={t.idx}
                  onPress={() => handleSwitchPosterTheme(t.idx)}
                  style={{
                    backgroundColor:
                      posterStyleVariant === t.idx ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                  }}
                  className="px-3.5 py-2 rounded-xl"
                >
                  <Text
                    style={{ color: posterStyleVariant === t.idx ? '#0F172A' : '#FFFFFF' }}
                    className="text-xs font-bold"
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setPreviewPosterUrl(null)}
              style={{ backgroundColor: '#2563EB' }}
              className="px-5 py-2.5 rounded-xl"
            >
              <Text className="text-xs font-bold text-white">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 4: SCHEDULE DRAFT ON CALENDAR                                  */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(schedulingDraftPost)}
        transparent
        animationType="slide"
        onRequestClose={() => setSchedulingDraftPost(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-bold text-slate-900">Schedule Draft Post</Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Pick a calendar date to schedule publishing
                </Text>
              </View>
              <Pressable
                onPress={() => setSchedulingDraftPost(null)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={16} color="#64748B" />
              </Pressable>
            </View>

            {/* Quick Date Presets */}
            <Text className="text-xs font-semibold text-slate-700 mb-2">Select Date & Occasion</Text>
            <View className="gap-2 mb-4">
              {/* Option A: Active Calendar Day */}
              <Pressable
                onPress={() => {
                  setScheduleTargetDate(
                    new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                  );
                }}
                style={{
                  borderColor:
                    scheduleTargetDate ===
                    new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                      ? '#2563EB'
                      : '#E2E8F0',
                  borderWidth: 1.5,
                  backgroundColor:
                    scheduleTargetDate ===
                    new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                      ? '#EFF6FF'
                      : '#F8FAFC',
                }}
                className="p-3 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Calendar size={16} color="#2563EB" />
                  <View className="ml-2.5">
                    <Text className="text-xs font-bold text-slate-800">
                      Active Calendar Day: {selectedDay} {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </Text>
                    <Text className="text-[11px] text-slate-500">Selected in calendar view above</Text>
                  </View>
                </View>
                <CheckCircle
                  size={16}
                  color={
                    scheduleTargetDate ===
                    new Date(calendarYear, calendarMonth, selectedDay, 10, 0).getTime()
                      ? '#2563EB'
                      : '#CBD5E1'
                  }
                />
              </Pressable>

              {/* Option B: Festival Day */}
              <Pressable
                onPress={() => {
                  setScheduleTargetDate(
                    new Date(
                      selectedFestival.year,
                      selectedFestival.monthIndex,
                      selectedFestival.day,
                      10,
                      0
                    ).getTime()
                  );
                }}
                style={{
                  borderColor:
                    scheduleTargetDate ===
                    new Date(
                      selectedFestival.year,
                      selectedFestival.monthIndex,
                      selectedFestival.day,
                      10,
                      0
                    ).getTime()
                      ? '#EA580C'
                      : '#E2E8F0',
                  borderWidth: 1.5,
                  backgroundColor:
                    scheduleTargetDate ===
                    new Date(
                      selectedFestival.year,
                      selectedFestival.monthIndex,
                      selectedFestival.day,
                      10,
                      0
                    ).getTime()
                      ? '#FFF7ED'
                      : '#F8FAFC',
                }}
                className="p-3 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Sparkles size={16} color="#EA580C" />
                  <View className="ml-2.5">
                    <Text className="text-xs font-bold text-slate-800">
                      {selectedFestival.name} Day ({selectedFestival.dateLabel})
                    </Text>
                    <Text className="text-[11px] text-slate-500">Prime festival campaign timing</Text>
                  </View>
                </View>
                <CheckCircle
                  size={16}
                  color={
                    scheduleTargetDate ===
                    new Date(
                      selectedFestival.year,
                      selectedFestival.monthIndex,
                      selectedFestival.day,
                      10,
                      0
                    ).getTime()
                      ? '#EA580C'
                      : '#CBD5E1'
                  }
                />
              </Pressable>
            </View>

            {/* Selected Post Summary Preview */}
            <View className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <Text className="text-[11px] text-slate-500 font-semibold mb-1">DRAFT PREVIEW</Text>
              <Text className="text-xs text-slate-700" numberOfLines={2}>
                {schedulingDraftPost?.summary}
              </Text>
            </View>

            {/* Confirm Schedule Button */}
            <Pressable
              onPress={async () => {
                if (!schedulingDraftPost) return;
                const res = await scheduleDraft(schedulingDraftPost.id, scheduleTargetDate);
                setSchedulingDraftPost(null);
                setActiveTab('scheduled');
                Alert.alert('Scheduled Successfully', res.message);
              }}
              style={{ backgroundColor: '#2563EB' }}
              className="py-3.5 rounded-xl flex-row items-center justify-center mb-2"
            >
              <Calendar size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-xs ml-2">
                Confirm & Schedule for{' '}
                {new Date(scheduleTargetDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* DEDICATED FULL-SCREEN DRAFT EDITOR MODAL                             */}
      {/* ==================================================================== */}
      <Modal
        visible={Boolean(editingDraftPost)}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditingDraftPost(null)}
      >
        <View className="flex-1 bg-slate-900 pt-12">
          {/* Header */}
          <View className="px-5 pb-4 flex-row items-center justify-between border-b border-slate-800">
            <View>
              <Text className="text-white text-lg font-bold">Edit Campaign Draft</Text>
              <Text className="text-slate-400 text-xs">
                {editingDraftPost?.status?.toUpperCase()} • {selectedLocation?.title || 'Business'}
              </Text>
            </View>
            <Pressable
              onPress={() => setEditingDraftPost(null)}
              className="w-9 h-9 rounded-full bg-slate-800 items-center justify-center"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 bg-slate-50 px-5 pt-4 pb-12">
            {/* 4:5 Poster Preview */}
            {editingDraftPost?.mediaUrl ? (
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 mb-2">Attached 4:5 Poster</Text>
                <Pressable
                  onPress={() => setPreviewPosterUrl(editingDraftPost.mediaUrl)}
                  style={{ aspectRatio: 4 / 5, maxHeight: 300 }}
                  className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200"
                >
                  <PosterGraphic uri={editingDraftPost.mediaUrl} />
                </Pressable>
              </View>
            ) : null}

            {/* Editable Google Business Caption */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Google Business Profile Caption
              </Text>
              <TextInput
                value={editGmbText}
                onChangeText={setEditGmbText}
                multiline
                numberOfLines={4}
                className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                style={{ minHeight: 90, textAlignVertical: 'top' }}
              />
            </View>

            {/* Editable Social Media Caption */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">
                Social Media Caption (Instagram / FB / LinkedIn)
              </Text>
              <TextInput
                value={editSocialText}
                onChangeText={setEditSocialText}
                multiline
                numberOfLines={4}
                className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                style={{ minHeight: 90, textAlignVertical: 'top' }}
              />
            </View>

            {/* Channels Selector */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-700 mb-2">Publishing Channels</Text>
              <View className="flex-row gap-2">
                {(['gmb', 'instagram', 'facebook', 'linkedin'] as PostChannel[]).map((ch) => {
                  const sel = editChannels.includes(ch);
                  return (
                    <Pressable
                      key={ch}
                      onPress={() => {
                        setEditChannels((prev) =>
                          sel ? prev.filter((c) => c !== ch) : [...prev, ch]
                        );
                      }}
                      style={{
                        backgroundColor: sel ? '#131A38' : '#FFFFFF',
                        borderColor: sel ? '#131A38' : '#CBD5E1',
                        borderWidth: 1,
                      }}
                      className="flex-1 py-2 rounded-xl items-center"
                    >
                      <Text
                        style={{ color: sel ? '#FFFFFF' : '#475569' }}
                        className="text-[11px] font-bold capitalize"
                      >
                        {ch === 'gmb' ? 'Google' : ch}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2.5 pb-16">
              <Pressable
                onPress={handleSaveDraftChanges}
                style={{ backgroundColor: '#131A38' }}
                className="py-3.5 rounded-xl items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-xs">Save Changes</Text>
              </Pressable>

              <Pressable
                onPress={handlePublishDraftFromModal}
                style={{ backgroundColor: '#10B981' }}
                className="py-3.5 rounded-xl flex-row items-center justify-center shadow-sm"
              >
                <Send size={15} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs ml-2">Publish Live Now</Text>
              </Pressable>

              <Pressable
                onPress={handleOpenDraftInStudio}
                className="py-3 rounded-xl flex-row items-center justify-center bg-indigo-50 border border-indigo-200"
              >
                <Sparkles size={14} color="#4F46E5" />
                <Text className="text-indigo-700 font-bold text-xs ml-1.5">
                  Open in AI Poster Studio
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await deletePost(editingDraftPost.id);
                        setEditingDraftPost(null);
                      },
                    },
                  ]);
                }}
                className="py-2.5 items-center justify-center"
              >
                <Text className="text-rose-600 font-semibold text-xs">Delete Draft</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};
