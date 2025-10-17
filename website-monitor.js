/**
 * Website Monitor - 官方网站监控器
 * 定期检查官方网站、公告页面、新闻等，自动提取最新信息
 */

class WebsiteMonitor {
    constructor() {
        this.monitoredSites = [
            {
                name: 'Official Website',
                url: 'https://animeraidgame.com',
                paths: ['/news', '/events', '/updates', '/codes'],
                selector: '.content, .news-item, .event-card, .code-box',
                interval: 3600000, // 1小时
                enabled: true
            },
            {
                name: 'Game News Page',
                url: 'https://news.animeraidgame.com',
                paths: ['/'],
                selector: 'article, .news-post, .announcement',
                interval: 1800000, // 30分钟
                enabled: true
            },
            {
                name: 'Patch Notes',
                url: 'https://animeraidgame.com/patch-notes',
                paths: ['/'],
                selector: '.patch-notes, .update-log, .version-info',
                interval: 7200000, // 2小时
                enabled: true
            }
        ];

        this.changeDetector = new ChangeDetector();
        this.contentExtractor = new ContentExtractor();
        this.scheduler = new TaskScheduler();
        this.alertManager = new AlertManager();

        this.init();
    }

    /**
     * 初始化监控器
     */
    init() {
        this.loadConfiguration();
        this.startMonitoring();
        this.setupEventHandlers();
        console.log('Website Monitor initialized');
    }

    /**
     * 开始监控
     */
    startMonitoring() {
        this.monitoredSites.forEach(site => {
            if (site.enabled) {
                this.scheduler.scheduleTask(() => {
                    this.monitorSite(site);
                }, site.interval, site.name);
            }
        });

        // 立即执行一次监控
        setTimeout(() => {
            this.performAllChecks();
        }, 5000);
    }

    /**
     * 监控单个网站
     */
    async monitorSite(site) {
        console.log(`🔍 Monitoring ${site.name}...`);

        try {
            const results = await this.checkSitePages(site);
            const changes = this.changeDetector.detectChanges(site.name, results);

            if (changes.length > 0) {
                await this.processChanges(site, changes);
            }

        } catch (error) {
            console.error(`❌ Failed to monitor ${site.name}:`, error);
            this.alertManager.sendErrorAlert(site, error);
        }
    }

    /**
     * 检查网站页面
     */
    async checkSitePages(site) {
        const results = [];

        for (const path of site.paths) {
            const url = site.url + path;
            try {
                const content = await this.fetchPageContent(url, site.selector);
                results.push({
                    url,
                    path,
                    content,
                    timestamp: new Date().toISOString()
                });

                // 请求间隔，避免过于频繁
                await this.wait(2000);
            } catch (error) {
                console.error(`Failed to fetch ${url}:`, error);
                results.push({
                    url,
                    path,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return results;
    }

    /**
     * 获取页面内容
     */
    async fetchPageContent(url, selector) {
        // 使用后端代理服务
        const response = await fetch('http://localhost:3001/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                selector,
                usePuppeteer: true // 使用Puppeteer处理JavaScript渲染
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    /**
     * 处理检测到的变化
     */
    async processChanges(site, changes) {
        console.log(`🚨 Found ${changes.length} changes on ${site.name}`);

        for (const change of changes) {
            try {
                await this.processChange(site, change);
            } catch (error) {
                console.error('Error processing change:', error);
            }
        }

        // 发送汇总通知
        this.alertManager.sendChangeSummary(site, changes);
    }

    /**
     * 处理单个变化
     */
    async processChange(site, change) {
        const extractedContent = this.contentExtractor.extract(change.content);

        // 提取兑换码
        if (extractedContent.codes.length > 0) {
            await this.processNewCodes(site, extractedContent.codes, change);
        }

        // 提取新闻/更新信息
        if (extractedContent.news.length > 0) {
            await this.processNewsUpdates(site, extractedContent.news, change);
        }

        // 提取事件信息
        if (extractedContent.events.length > 0) {
            await this.processEvents(site, extractedContent.events, change);
        }

        // 提取版本更新信息
        if (extractedContent.versionInfo) {
            await this.processVersionUpdate(site, extractedContent.versionInfo, change);
        }
    }

    /**
     * 处理新兑换码
     */
    async processNewCodes(site, codes, change) {
        for (const codeData of codes) {
            const codeInfo = {
                code: codeData.code,
                rewards: codeData.rewards || 'Various rewards',
                description: `Auto-scraped from ${site.name}`,
                source: 'website',
                sourceUrl: change.url,
                foundAt: new Date().toISOString(),
                confidence: codeData.confidence,
                expires: codeData.expires || this.estimateExpiry(codeData.context)
            };

            // 添加到CMS系统
            if (window.cms) {
                window.cms.addNewCode(codeInfo);
            }

            // 通知更新系统
            this.notifyNewCode(codeInfo);
        }
    }

    /**
     * 处理新闻更新
     */
    async processNewsUpdates(site, news, change) {
        for (const newsItem of news) {
            const newsInfo = {
                title: newsItem.title,
                content: newsItem.content,
                url: change.url,
                source: site.name,
                publishedAt: newsItem.publishedAt || new Date().toISOString(),
                category: newsItem.category || 'general'
            };

            // 存储新闻信息
            await this.storeNewsUpdate(newsInfo);

            // 通知新闻更新
            this.notifyNewsUpdate(newsInfo);
        }
    }

    /**
     * 处理事件信息
     */
    async processEvents(site, events, change) {
        for (const event of events) {
            const eventInfo = {
                name: event.name,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                url: change.url,
                source: site.name,
                type: event.type || 'general'
            };

            await this.storeEventUpdate(eventInfo);
            this.notifyEventUpdate(eventInfo);
        }
    }

    /**
     * 处理版本更新
     */
    async processVersionUpdate(site, versionInfo, change) {
        const updateInfo = {
            version: versionInfo.version,
            releaseNotes: versionInfo.releaseNotes,
            downloadUrl: versionInfo.downloadUrl,
            updateDate: new Date().toISOString(),
            source: site.name,
            url: change.url
        };

        await this.storeVersionUpdate(updateInfo);
        this.notifyVersionUpdate(updateInfo);
    }

    /**
     * 估算过期时间
     */
    estimateExpiry(context) {
        const timePatterns = {
            '24h|24 hour|1 day': 1,
            '48h|48 hour|2 day': 2,
            '3 day': 3,
            '1 week|7 day': 7,
            '2 week|14 day': 14,
            '1 month|30 day': 30
        };

        for (const [pattern, days] of Object.entries(timePatterns)) {
            if (new RegExp(pattern, 'i').test(context)) {
                const date = new Date();
                date.setDate(date.getDate() + days);
                return date.toISOString().split('T')[0];
            }
        }

        // 默认30天后过期
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }

    /**
     * 存储新闻更新
     */
    async storeNewsUpdate(newsInfo) {
        const news = this.getStoredNews();
        news.unshift(newsInfo);

        // 保留最近100条新闻
        if (news.length > 100) {
            news.splice(100);
        }

        localStorage.setItem('website_monitor_news', JSON.stringify(news));
    }

    /**
     * 存储事件更新
     */
    async storeEventUpdate(eventInfo) {
        const events = this.getStoredEvents();
        events.unshift(eventInfo);

        // 保留最近50个事件
        if (events.length > 50) {
            events.splice(50);
        }

        localStorage.setItem('website_monitor_events', JSON.stringify(events));
    }

    /**
     * 存储版本更新
     */
    async storeVersionUpdate(updateInfo) {
        const updates = this.getStoredVersionUpdates();
        updates.unshift(updateInfo);

        // 保留最近20个版本更新
        if (updates.length > 20) {
            updates.splice(20);
        }

        localStorage.setItem('website_monitor_updates', JSON.stringify(updates));
    }

    /**
     * 获取存储的新闻
     */
    getStoredNews() {
        try {
            const stored = localStorage.getItem('website_monitor_news');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取存储的事件
     */
    getStoredEvents() {
        try {
            const stored = localStorage.getItem('website_monitor_events');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取存储的版本更新
     */
    getStoredVersionUpdates() {
        try {
            const stored = localStorage.getItem('website_monitor_updates');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 通知新兑换码
     */
    notifyNewCode(codeInfo) {
        const event = new CustomEvent('newWebsiteCode', {
            detail: codeInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * 通知新闻更新
     */
    notifyNewsUpdate(newsInfo) {
        const event = new CustomEvent('newsUpdate', {
            detail: newsInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * 通知事件更新
     */
    notifyEventUpdate(eventInfo) {
        const event = new CustomEvent('eventUpdate', {
            detail: eventInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * 通知版本更新
     */
    notifyVersionUpdate(updateInfo) {
        const event = new CustomEvent('versionUpdate', {
            detail: updateInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * 执行所有检查
     */
    async performAllChecks() {
        console.log('🔄 Performing comprehensive website check...');

        for (const site of this.monitoredSites) {
            if (site.enabled) {
                await this.monitorSite(site);
                await this.wait(5000); // 站点间隔5秒
            }
        }

        console.log('✅ Comprehensive check completed');
    }

    /**
     * 加载配置
     */
    loadConfiguration() {
        try {
            const stored = localStorage.getItem('website_monitor_config');
            if (stored) {
                const config = JSON.parse(stored);
                this.monitoredSites = config.sites || this.monitoredSites;
            }
        } catch (error) {
            console.error('Failed to load website monitor config:', error);
        }
    }

    /**
     * 保存配置
     */
    saveConfiguration() {
        try {
            const config = {
                sites: this.monitoredSites,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('website_monitor_config', JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save website monitor config:', error);
        }
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 手动触发检查
        document.addEventListener('triggerWebsiteCheck', () => {
            this.performAllChecks();
        });

        // 更新配置
        document.addEventListener('updateWebsiteMonitorConfig', (event) => {
            const config = event.detail;
            if (config.sites) {
                this.monitoredSites = config.sites;
                this.saveConfiguration();
            }
        });
    }

    /**
     * 获取监控统计
     */
    getMonitoringStats() {
        return {
            monitoredSites: this.monitoredSites.length,
            enabledSites: this.monitoredSites.filter(site => site.enabled).length,
            lastCheck: this.changeDetector.getLastCheckTime(),
            totalChanges: this.changeDetector.getTotalChanges(),
            news: this.getStoredNews().length,
            events: this.getStoredEvents().length,
            updates: this.getStoredVersionUpdates().length
        };
    }

    /**
     * 等待指定毫秒
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 变化检测器
 */
class ChangeDetector {
    constructor() {
        this.previousContent = new Map();
        this.changeHistory = [];
    }

    /**
     * 检测变化
     */
    detectChanges(siteName, results) {
        const changes = [];
        const siteKey = siteName;

        for (const result of results) {
            if (result.error) {
                continue; // 跳过错误结果
            }

            const contentHash = this.generateContentHash(result.content);
            const previousData = this.previousContent.get(`${siteKey}-${result.url}`);

            if (!previousData || previousData.hash !== contentHash) {
                const change = {
                    type: 'content_change',
                    site: siteName,
                    url: result.url,
                    path: result.path,
                    content: result.content,
                    previousHash: previousData ? previousData.hash : null,
                    newHash: contentHash,
                    timestamp: result.timestamp,
                    changeDetected: !previousData
                };

                changes.push(change);
                this.previousContent.set(`${siteKey}-${result.url}`, {
                    hash: contentHash,
                    timestamp: result.timestamp
                });
            }
        }

        if (changes.length > 0) {
            this.recordChanges(changes);
        }

        return changes;
    }

    /**
     * 生成内容哈希
     */
    generateContentHash(content) {
        // 简单的哈希算法（生产环境建议使用更强的哈希）
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString(36);
    }

    /**
     * 记录变化
     */
    recordChanges(changes) {
        this.changeHistory.push(...changes);

        // 保留最近1000条变化记录
        if (this.changeHistory.length > 1000) {
            this.changeHistory = this.changeHistory.slice(-1000);
        }

        localStorage.setItem('website_monitor_changes', JSON.stringify(this.changeHistory));
    }

    /**
     * 获取最后检查时间
     */
    getLastCheckTime() {
        if (this.changeHistory.length === 0) {
            return null;
        }
        return this.changeHistory[this.changeHistory.length - 1].timestamp;
    }

    /**
     * 获取总变化数
     */
    getTotalChanges() {
        return this.changeHistory.length;
    }
}

/**
 * 内容提取器
 */
class ContentExtractor {
    /**
     * 提取内容
     */
    extract(contentData) {
        const result = {
            codes: [],
            news: [],
            events: [],
            versionInfo: null
        };

        if (!contentData.content) {
            return result;
        }

        const content = contentData.content;

        // 提取兑换码
        result.codes = this.extractCodes(content);

        // 提取新闻
        result.news = this.extractNews(content, contentData.url);

        // 提取事件
        result.events = this.extractEvents(content);

        // 提取版本信息
        result.versionInfo = this.extractVersionInfo(content);

        return result;
    }

    /**
     * 提取兑换码
     */
    extractCodes(content) {
        const codes = [];
        const codePatterns = [
            /\b([A-Z0-9]{8,20})\b/g,
            /\b(GIFT|CODE|PROMO|REDEEM)[-_]?([A-Z0-9]{6,16})\b/gi,
            /\b([A-Z]{3,}[-_]?[0-9]{3,})\b/g
        ];

        codePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const code = match[1] || match[0];
                if (this.isValidCode(code)) {
                    codes.push({
                        code: code,
                        context: this.extractContext(content, code),
                        confidence: this.calculateConfidence(code, content)
                    });
                }
            }
        });

        return codes;
    }

    /**
     * 提取新闻
     */
    extractNews(content, url) {
        const news = [];

        // 简单的新闻标题提取
        const titlePattern = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
        let match;

        while ((match = titlePattern.exec(content)) !== null) {
            const title = match[1].replace(/<[^>]*>/g, '').trim();
            if (title.length > 10 && title.length < 200) {
                news.push({
                    title: title,
                    content: this.extractContentAfterTitle(content, match.index),
                    url: url,
                    category: this.categorizeNews(title)
                });
            }
        }

        return news.slice(0, 5); // 最多5条新闻
    }

    /**
     * 提取事件
     */
    extractEvents(content) {
        const events = [];

        const eventPattern = /(event|celebration|festival).*?(start|begin|end|finish).*?(\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)/gi;

        let match;
        while ((match = eventPattern.exec(content)) !== null) {
            events.push({
                name: this.extractEventName(content, match.index),
                description: this.extractContext(content, match[0]),
                type: 'game_event'
            });
        }

        return events.slice(0, 3); // 最多3个事件
    }

    /**
     * 提取版本信息
     */
    extractVersionInfo(content) {
        const versionPattern = /version\s*(\d+\.\d+(\.\d+)?)/i;
        const match = versionPattern.exec(content);

        if (match) {
            return {
                version: match[1],
                releaseNotes: this.extractContext(content, match[0]),
                downloadUrl: this.extractDownloadUrl(content)
            };
        }

        return null;
    }

    /**
     * 验证兑换码
     */
    isValidCode(code) {
        if (code.length < 6 || code.length > 25) return false;

        const excludeWords = ['AND', 'THE', 'FOR', 'WITH', 'HAVE'];
        if (excludeWords.includes(code)) return false;

        const hasNumber = /\d/.test(code);
        const hasLetter = /[A-Z]/.test(code);

        return hasNumber || hasLetter;
    }

    /**
     * 提取上下文
     */
    extractContext(content, text) {
        const index = content.indexOf(text);
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + text.length + 100);
        return content.substring(start, end).replace(/<[^>]*>/g, '').trim();
    }

    /**
     * 计算置信度
     */
    calculateConfidence(code, content) {
        let confidence = 0.5;

        if (code.length >= 8 && code.length <= 16) confidence += 0.2;
        if (/\d/.test(code)) confidence += 0.1;

        const keywords = ['code', 'gift', 'promo', 'redeem'];
        const hasKeywords = keywords.some(keyword =>
            content.toLowerCase().includes(keyword)
        );
        if (hasKeywords) confidence += 0.2;

        return Math.min(1.0, confidence);
    }

    /**
     * 提取标题后的内容
     */
    extractContentAfterTitle(content, titleIndex) {
        const afterTitle = content.substring(titleIndex);
        const contentMatch = afterTitle.match(/^(.{100,300})/);
        return contentMatch ? contentMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    }

    /**
     * 新闻分类
     */
    categorizeNews(title) {
        const titleLower = title.toLowerCase();

        if (titleLower.includes('update') || titleLower.includes('patch')) {
            return 'update';
        } else if (titleLower.includes('event') || titleLower.includes('celebration')) {
            return 'event';
        } else if (titleLower.includes('maintenance')) {
            return 'maintenance';
        } else {
            return 'general';
        }
    }

    /**
     * 提取事件名称
     */
    extractEventName(content, index) {
        const beforeEvent = content.substring(0, index);
        const titleMatch = beforeEvent.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/i);
        return titleMatch ? titleMatch[1].trim() : 'Unknown Event';
    }

    /**
     * 提取下载链接
     */
    extractDownloadUrl(content) {
        const downloadPattern = /(download|get).*?(https?:\/\/[^\s]+)/i;
        const match = downloadPattern.exec(content);
        return match ? match[2] : null;
    }
}

/**
 * 任务调度器
 */
class TaskScheduler {
    constructor() {
        this.tasks = new Map();
    }

    scheduleTask(task, interval, name) {
        // 清除现有任务
        if (this.tasks.has(name)) {
            clearInterval(this.tasks.get(name));
        }

        // 设置新任务
        const taskId = setInterval(task, interval);
        this.tasks.set(name, taskId);

        console.log(`Scheduled task "${name}" with interval ${interval}ms`);
    }

    cancelTask(name) {
        if (this.tasks.has(name)) {
            clearInterval(this.tasks.get(name));
            this.tasks.delete(name);
            console.log(`Cancelled task "${name}"`);
        }
    }

    cancelAllTasks() {
        for (const [name, taskId] of this.tasks) {
            clearInterval(taskId);
        }
        this.tasks.clear();
        console.log('Cancelled all scheduled tasks');
    }
}

/**
 * 警报管理器
 */
class AlertManager {
    sendErrorAlert(site, error) {
        console.error(`🚨 Error monitoring ${site.name}:`, error);

        // 可以发送邮件、Webhook通知等
        const event = new CustomEvent('websiteMonitorError', {
            detail: { site: site.name, error: error.message }
        });
        document.dispatchEvent(event);
    }

    sendChangeSummary(site, changes) {
        console.log(`📊 Change summary for ${site.name}: ${changes.length} changes detected`);

        const event = new CustomEvent('websiteChangesDetected', {
            detail: { site: site.name, changes }
        });
        document.dispatchEvent(event);
    }
}

// 导出监控器实例
window.websiteMonitor = new WebsiteMonitor();
window.WebsiteMonitor = WebsiteMonitor;

// 全局触发检查函数
window.triggerWebsiteCheck = () => {
    window.websiteMonitor.performAllChecks();
};

console.log('Website Monitor loaded successfully');