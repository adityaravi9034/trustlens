import browser from 'webextension-polyfill';

interface Settings {
  enabled: boolean;
  realTimeAnalysis: boolean;
  showNotifications: boolean;
  confidenceThreshold: number;
  categories: Record<string, boolean>;
}

interface PageAnalysis {
  trustScore: number;
  itemsAnalyzed: number;
  flaggedItems: number;
  categories: Record<string, number>;
  lastUpdated: string;
}

class PopupController {
  private settings: Settings | null = null;
  private pageAnalysis: PageAnalysis | null = null;
  private currentTab: browser.Tabs.Tab | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.getCurrentTab();
    await this.loadSettings();
    await this.loadPageAnalysis();
    this.setupEventListeners();
    this.updateUI();
  }

  private async getCurrentTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0] || null;
  }

  private async loadSettings() {
    try {
      this.settings = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS'
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  private async loadPageAnalysis() {
    if (!this.currentTab?.url) return;

    try {
      this.pageAnalysis = await browser.runtime.sendMessage({
        type: 'GET_PAGE_ANALYSIS',
        data: { url: this.currentTab.url }
      });

      // If no cached analysis, trigger a new one
      if (!this.pageAnalysis) {
        this.triggerPageAnalysis();
      }
    } catch (error) {
      console.error('Failed to load page analysis:', error);
    }
  }

  private setupEventListeners() {
    // Analyze page button
    const analyzeBtn = document.getElementById('analyzePageBtn');
    analyzeBtn?.addEventListener('click', () => this.analyzeCurrentPage());

    // Toggle highlights button
    const toggleBtn = document.getElementById('toggleHighlightsBtn');
    toggleBtn?.addEventListener('click', () => this.toggleHighlights());

    // Real-time analysis toggle
    const realTimeToggle = document.getElementById('realTimeToggle') as HTMLInputElement;
    realTimeToggle?.addEventListener('change', (e) => {
      this.updateSetting('realTimeAnalysis', (e.target as HTMLInputElement).checked);
    });

    // Notifications toggle
    const notificationsToggle = document.getElementById('notificationsToggle') as HTMLInputElement;
    notificationsToggle?.addEventListener('change', (e) => {
      this.updateSetting('showNotifications', (e.target as HTMLInputElement).checked);
    });

    // Confidence threshold slider
    const confidenceSlider = document.getElementById('confidenceSlider') as HTMLInputElement;
    confidenceSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value) / 100;
      this.updateSetting('confidenceThreshold', value);
      this.updateConfidenceDisplay(value);
    });

    // Footer buttons
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      this.openSettingsPage();
    });

    document.getElementById('helpBtn')?.addEventListener('click', () => {
      this.openHelpPage();
    });

    document.getElementById('reportBtn')?.addEventListener('click', () => {
      this.openReportPage();
    });
  }

  private updateUI() {
    this.updateStatusIndicator();
    this.updateTrustScore();
    this.updateQuickStats();
    this.updateCategoryBreakdown();
    this.updateSettingsControls();
  }

  private updateStatusIndicator() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDot = statusIndicator?.querySelector('.status-dot');
    const statusText = statusIndicator?.querySelector('.status-text');

    if (!this.settings?.enabled) {
      statusDot?.classList.add('disabled');
      if (statusText) statusText.textContent = 'Disabled';
    } else if (this.pageAnalysis) {
      statusDot?.classList.add('active');
      if (statusText) statusText.textContent = 'Active';
    } else {
      statusDot?.classList.add('analyzing');
      if (statusText) statusText.textContent = 'Analyzing...';
    }
  }

  private updateTrustScore() {
    const trustScoreElement = document.getElementById('trustScore');
    if (trustScoreElement) {
      if (this.pageAnalysis) {
        trustScoreElement.textContent = Math.round(this.pageAnalysis.trustScore * 100).toString();
      } else {
        trustScoreElement.textContent = '--';
      }
    }
  }

  private updateQuickStats() {
    const itemsAnalyzedElement = document.getElementById('itemsAnalyzed');
    const flaggedItemsElement = document.getElementById('flaggedItems');

    if (itemsAnalyzedElement) {
      itemsAnalyzedElement.textContent = this.pageAnalysis?.itemsAnalyzed.toString() || '0';
    }

    if (flaggedItemsElement) {
      flaggedItemsElement.textContent = this.pageAnalysis?.flaggedItems.toString() || '0';
    }
  }

  private updateCategoryBreakdown() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    categoryList.innerHTML = '';

    const categories = this.pageAnalysis?.categories || {};
    const categoryNames = {
      manipulation: 'Manipulation',
      bias: 'Bias',
      deception: 'Deception',
      clickbait: 'Clickbait',
      misinformation: 'Misinformation',
      fearFraming: 'Fear Framing',
      loadedLanguage: 'Loaded Language',
      adHominem: 'Ad Hominem'
    };

    Object.entries(categories).forEach(([key, score]) => {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'category-item';
      categoryElement.innerHTML = `
        <div class="category-header">
          <span class="category-name">${categoryNames[key as keyof typeof categoryNames] || key}</span>
          <span class="category-score">${Math.round(score * 100)}%</span>
        </div>
        <div class="category-bar">
          <div class="category-fill" style="width: ${score * 100}%; background-color: ${this.getCategoryColor(score)}"></div>
        </div>
      `;
      categoryList.appendChild(categoryElement);
    });

    if (Object.keys(categories).length === 0) {
      categoryList.innerHTML = '<p class="no-data">No analysis data available</p>';
    }
  }

  private updateSettingsControls() {
    if (!this.settings) return;

    const realTimeToggle = document.getElementById('realTimeToggle') as HTMLInputElement;
    if (realTimeToggle) {
      realTimeToggle.checked = this.settings.realTimeAnalysis;
    }

    const notificationsToggle = document.getElementById('notificationsToggle') as HTMLInputElement;
    if (notificationsToggle) {
      notificationsToggle.checked = this.settings.showNotifications;
    }

    const confidenceSlider = document.getElementById('confidenceSlider') as HTMLInputElement;
    if (confidenceSlider) {
      confidenceSlider.value = (this.settings.confidenceThreshold * 100).toString();
      this.updateConfidenceDisplay(this.settings.confidenceThreshold);
    }
  }

  private updateConfidenceDisplay(value: number) {
    const confidenceValue = document.getElementById('confidenceValue');
    if (confidenceValue) {
      confidenceValue.textContent = `${Math.round(value * 100)}%`;
    }
  }

  private getCategoryColor(score: number): string {
    if (score > 0.7) return '#ff4444';
    if (score > 0.4) return '#ffaa00';
    return '#44aa44';
  }

  private async updateSetting(key: string, value: any) {
    if (!this.settings) return;

    (this.settings as any)[key] = value;

    try {
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: { [key]: value }
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  }

  private async analyzeCurrentPage() {
    if (!this.currentTab?.id) return;

    this.showLoading();

    try {
      // Trigger content script analysis
      await browser.tabs.sendMessage(this.currentTab.id, {
        type: 'START_PAGE_ANALYSIS',
        data: { url: this.currentTab.url }
      });

      // Reload analysis after a delay
      setTimeout(async () => {
        await this.loadPageAnalysis();
        this.updateUI();
        this.hideLoading();
      }, 3000);
    } catch (error) {
      console.error('Failed to analyze page:', error);
      this.hideLoading();
    }
  }

  private async toggleHighlights() {
    if (!this.currentTab?.id) return;

    try {
      await browser.tabs.sendMessage(this.currentTab.id, {
        type: 'TOGGLE_ANALYSIS'
      });
    } catch (error) {
      console.error('Failed to toggle highlights:', error);
    }
  }

  private async triggerPageAnalysis() {
    if (!this.currentTab?.id) return;

    try {
      await browser.tabs.sendMessage(this.currentTab.id, {
        type: 'START_PAGE_ANALYSIS',
        data: { url: this.currentTab.url }
      });
    } catch (error) {
      console.error('Failed to trigger page analysis:', error);
    }
  }

  private showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.style.display = 'flex';
    }
  }

  private hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }

  private openSettingsPage() {
    browser.runtime.openOptionsPage();
  }

  private openHelpPage() {
    browser.tabs.create({
      url: 'https://docs.trustlens.ai/extension'
    });
  }

  private openReportPage() {
    browser.tabs.create({
      url: 'https://github.com/trustlens/extension/issues'
    });
  }

  private getDefaultSettings(): Settings {
    return {
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
    };
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}