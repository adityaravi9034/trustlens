import browser from 'webextension-polyfill';
// import { TrustLensSDK } from '@trustlens/sdk-js';

class BackgroundService {
  private sdk: any;
  private analysisCache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.sdk = {
      async analyze(request: any) {
        // Mock implementation for browser extension
        const trustScore = Math.random() * 0.4 + 0.3; // 0.3-0.7 range
        return {
          trustScore,
          categories: {
            manipulation: Math.random() * 0.8,
            bias: Math.random() * 0.6,
            deception: Math.random() * 0.7,
            clickbait: Math.random() * 0.9
          },
          explanation: `Analysis detected potential manipulation patterns in the content. Trust score: ${Math.round(trustScore * 100)}%`,
          confidence: 0.85
        };
      }
    };
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle installation
    browser.runtime.onInstalled.addListener(this.handleInstall.bind(this));

    // Handle context menu clicks
    browser.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));

    // Handle messages from content script and popup
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Handle tab updates for real-time analysis
    browser.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  private async handleInstall() {
    // Create context menu
    browser.contextMenus.create({
      id: 'analyze-text',
      title: 'Analyze with TrustLens',
      contexts: ['selection']
    });

    // Set default settings
    await browser.storage.sync.set({
      enabled: true,
      realTimeAnalysis: true,
      showNotifications: true,
      confidenceThreshold: 0.7,
      categories: {
        manipulation: true,
        bias: true,
        deception: true,
        clickbait: true,
        misinformation: true
      }
    });
  }

  private async handleContextMenu(info: any) {
    if (info.menuItemId === 'analyze-text' && info.selectionText) {
      const result = await this.analyzeContent({
        text: info.selectionText,
        url: info.pageUrl || '',
        type: 'text'
      });

      // Send result to content script for display
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'SHOW_ANALYSIS_RESULT',
          data: result
        });
      }
    }
  }

  private async handleMessage(message: any, sender: browser.Runtime.MessageSender) {
    switch (message.type) {
      case 'ANALYZE_CONTENT':
        return this.analyzeContent(message.data);

      case 'GET_PAGE_ANALYSIS':
        return this.getPageAnalysis(message.data.url);

      case 'UPDATE_SETTINGS':
        return this.updateSettings(message.data);

      case 'GET_SETTINGS':
        return this.getSettings();

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private async handleTabUpdate(tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      const settings = await this.getSettings();
      if (settings.enabled && settings.realTimeAnalysis) {
        // Trigger real-time analysis of the page
        browser.tabs.sendMessage(tabId, {
          type: 'START_PAGE_ANALYSIS',
          data: { url: tab.url }
        });
      }
    }
  }

  private async analyzeContent(data: { text: string; url: string; type: string }) {
    const cacheKey = `${data.url}:${this.hashString(data.text)}`;

    // Check cache first
    const cached = this.analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      const result = await this.sdk.analyze({
        content: data.text,
        metadata: {
          url: data.url,
          type: data.type,
          timestamp: new Date().toISOString()
        }
      });

      // Cache result
      this.analysisCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      // Show notification if enabled and confidence is high
      const settings = await this.getSettings();
      if (settings.showNotifications && result.trustScore < settings.confidenceThreshold) {
        this.showAnalysisNotification(result);
      }

      return result;
    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        error: 'Analysis failed',
        trustScore: 0.5,
        categories: {},
        explanation: 'Unable to analyze content at this time.'
      };
    }
  }

  private async getPageAnalysis(url: string) {
    // Get cached analysis for the page
    const pageKey = `page:${url}`;
    const cached = this.analysisCache.get(pageKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    return null;
  }

  private async updateSettings(newSettings: any) {
    await browser.storage.sync.set(newSettings);
    return { success: true };
  }

  private async getSettings() {
    const result = await browser.storage.sync.get([
      'enabled',
      'realTimeAnalysis',
      'showNotifications',
      'confidenceThreshold',
      'categories'
    ]);

    return {
      enabled: result.enabled ?? true,
      realTimeAnalysis: result.realTimeAnalysis ?? true,
      showNotifications: result.showNotifications ?? true,
      confidenceThreshold: result.confidenceThreshold ?? 0.7,
      categories: result.categories ?? {
        manipulation: true,
        bias: true,
        deception: true,
        clickbait: true,
        misinformation: true
      }
    };
  }

  private showAnalysisNotification(result: any) {
    const riskLevel = result.trustScore < 0.3 ? 'High' :
                     result.trustScore < 0.6 ? 'Medium' : 'Low';

    browser.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'TrustLens Detection',
      message: `${riskLevel} risk content detected (Trust Score: ${Math.round(result.trustScore * 100)}%)`
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

// Initialize background service
new BackgroundService();