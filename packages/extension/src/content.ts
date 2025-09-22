import browser from 'webextension-polyfill';

interface AnalysisResult {
  trustScore: number;
  categories: Record<string, number>;
  explanation: string;
  confidence: number;
}

class ContentAnalyzer {
  private isAnalyzing = false;
  private overlayVisible = false;
  private analysisCache = new Map<string, AnalysisResult>();
  private observer: MutationObserver | null = null;
  private highlightedElements = new Set<Element>();

  constructor() {
    this.setupMessageListener();
    this.initializePageAnalysis();
  }

  private setupMessageListener() {
    browser.runtime.onMessage.addListener((message) => {
      switch (message.type) {
        case 'START_PAGE_ANALYSIS':
          this.analyzePageContent();
          break;
        case 'SHOW_ANALYSIS_RESULT':
          this.showAnalysisOverlay(message.data);
          break;
        case 'TOGGLE_ANALYSIS':
          this.toggleAnalysis();
          break;
      }
    });
  }

  private async initializePageAnalysis() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.analyzePageContent(), 1000);
      });
    } else {
      setTimeout(() => this.analyzePageContent(), 1000);
    }

    // Set up mutation observer for dynamic content
    this.observer = new MutationObserver((mutations) => {
      let shouldAnalyze = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.isContentElement(element)) {
                shouldAnalyze = true;
              }
            }
          });
        }
      });

      if (shouldAnalyze) {
        setTimeout(() => this.analyzeNewContent(), 2000);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private async analyzePageContent() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    try {
      const contentElements = this.getContentElements();
      const analysisPromises = contentElements.map(element => this.analyzeElement(element));
      await Promise.allSettled(analysisPromises);
    } catch (error) {
      console.error('Page analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async analyzeNewContent() {
    const newElements = this.getContentElements().filter(el => !this.highlightedElements.has(el));
    const analysisPromises = newElements.map(element => this.analyzeElement(element));
    await Promise.allSettled(analysisPromises);
  }

  private getContentElements(): Element[] {
    const selectors = [
      'article',
      '[role="article"]',
      '.post',
      '.tweet',
      '.story',
      '.article',
      '.content',
      'p:not(.small)',
      'h1, h2, h3',
      '.headline',
      '.title',
      '[data-testid="tweet"]',
      '.feed-item',
      '.news-item'
    ];

    const elements: Element[] = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      found.forEach(el => {
        if (this.isValidContentElement(el)) {
          elements.push(el);
        }
      });
    });

    return elements;
  }

  private isContentElement(element: Element): boolean {
    const contentSelectors = ['article', 'p', 'h1', 'h2', 'h3', '.post', '.tweet', '.story'];
    return contentSelectors.some(selector => element.matches(selector));
  }

  private isValidContentElement(element: Element): boolean {
    const text = element.textContent?.trim() || '';
    return text.length > 50 && // Minimum text length
           !element.closest('nav') && // Not in navigation
           !element.closest('footer') && // Not in footer
           !element.closest('.ad') && // Not an ad
           !element.closest('[class*="ad-"]') && // Not an ad container
           !this.highlightedElements.has(element); // Not already analyzed
  }

  private async analyzeElement(element: Element) {
    const text = element.textContent?.trim() || '';
    if (text.length < 50) return;

    const cacheKey = this.hashString(text);
    let result = this.analysisCache.get(cacheKey);

    if (!result) {
      try {
        result = await browser.runtime.sendMessage({
          type: 'ANALYZE_CONTENT',
          data: {
            text,
            url: window.location.href,
            type: 'text'
          }
        });

        if (result) {
          this.analysisCache.set(cacheKey, result);
        }
      } catch (error) {
        console.error('Analysis request failed:', error);
        return;
      }
    }

    if (result && result.trustScore < 0.7) {
      this.highlightSuspiciousContent(element, result);
    }

    this.highlightedElements.add(element);
  }

  private highlightSuspiciousContent(element: Element, result: AnalysisResult) {
    const riskLevel = result.trustScore < 0.3 ? 'high' :
                     result.trustScore < 0.6 ? 'medium' : 'low';

    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.className = `trustlens-indicator trustlens-${riskLevel}`;
    indicator.innerHTML = `
      <div class="trustlens-badge">
        <span class="trustlens-icon">⚠️</span>
        <span class="trustlens-score">${Math.round(result.trustScore * 100)}%</span>
      </div>
    `;

    // Position indicator
    (element as HTMLElement).style.position = 'relative';
    indicator.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      z-index: 10000;
      background: ${riskLevel === 'high' ? '#ff4444' : riskLevel === 'medium' ? '#ffaa00' : '#ffcc00'};
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // Add click handler for detailed view
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showDetailedAnalysis(element, result);
    });

    element.appendChild(indicator);

    // Add subtle border highlight
    (element as HTMLElement).style.border = `2px solid ${
      riskLevel === 'high' ? '#ff4444' :
      riskLevel === 'medium' ? '#ffaa00' : '#ffcc00'
    }`;
    (element as HTMLElement).style.borderRadius = '4px';
  }

  private showDetailedAnalysis(element: Element, result: AnalysisResult) {
    // Remove existing overlay
    const existingOverlay = document.querySelector('.trustlens-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create detailed overlay
    const overlay = document.createElement('div');
    overlay.className = 'trustlens-overlay';
    overlay.innerHTML = `
      <div class="trustlens-modal">
        <div class="trustlens-header">
          <h3>TrustLens Analysis</h3>
          <button class="trustlens-close">×</button>
        </div>
        <div class="trustlens-content">
          <div class="trustlens-score-display">
            <div class="score-circle">
              <span class="score-value">${Math.round(result.trustScore * 100)}%</span>
              <span class="score-label">Trust Score</span>
            </div>
          </div>
          <div class="trustlens-categories">
            <h4>Detection Categories</h4>
            ${Object.entries(result.categories || {}).map(([category, score]) => `
              <div class="category-item">
                <span class="category-name">${category}</span>
                <div class="category-bar">
                  <div class="category-fill" style="width: ${score * 100}%"></div>
                </div>
                <span class="category-score">${Math.round(score * 100)}%</span>
              </div>
            `).join('')}
          </div>
          <div class="trustlens-explanation">
            <h4>Explanation</h4>
            <p>${result.explanation || 'No explanation available.'}</p>
          </div>
        </div>
      </div>
    `;

    // Style the overlay
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `;

    // Add close functionality
    const closeBtn = overlay.querySelector('.trustlens-close');
    closeBtn?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  private showAnalysisOverlay(result: AnalysisResult) {
    // Show floating notification for context menu analysis
    const notification = document.createElement('div');
    notification.className = 'trustlens-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>TrustLens Analysis</strong>
        <p>Trust Score: ${Math.round(result.trustScore * 100)}%</p>
        <p>${result.explanation}</p>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #0066cc;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 999999;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  private toggleAnalysis() {
    this.highlightedElements.forEach(element => {
      const indicator = element.querySelector('.trustlens-indicator');
      if (indicator) {
        indicator.remove();
      }
      (element as HTMLElement).style.border = '';
    });

    if (!this.overlayVisible) {
      this.analyzePageContent();
    }
    this.overlayVisible = !this.overlayVisible;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}

// Initialize content analyzer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentAnalyzer();
  });
} else {
  new ContentAnalyzer();
}