/**
 * Auto Content Integrator - 自动内容集成器
 * 将所有抓取功能整合到现有的更新系统中，实现完全自动化
 */

class AutoContentIntegrator {
    constructor() {
        this.components = {
            scraper: null,
            websiteMonitor: null,
            compliance: null,
            cms: null,
            updateManager: null
        };

        this.integrations = {
            twitter: { enabled: true, priority: 1 },
            discord: { enabled: true, priority: 1 },
            website: { enabled: true, priority: 2 },
            reddit: { enabled: false, priority: 3 } // 默认禁用
        };

        this.processingQueue = new ProcessingQueue();
        this.contentValidator = new IntegratedContentValidator();
        this.notificationManager = new IntegratedNotificationManager();
        this.analytics = new IntegrationAnalytics();

        this.isRunning = false;
        this.lastIntegration = null;

        this.init();
    }

    /**
     * 初始化集成器
     */
    init() {
        this.initializeComponents();
        this.setupIntegrations();
        this.setupEventHandlers();
        this.startAutoIntegration();
        console.log('Auto Content Integrator initialized');
    }

    /**
     * 初始化组件
     */
    initializeComponents() {
        // 等待所有组件加载完成
        this.waitForComponents().then(() => {
            this.components.scraper = window.gameContentScraper;
            this.components.websiteMonitor = window.websiteMonitor;
            this.components.compliance = window.scraperCompliance;
            this.components.cms = window.cms;
            this.components.updateManager = window.updateManager;

            console.log('All components initialized for integration');
        });
    }

    /**
     * 等待组件加载
     */
    waitForComponents() {
        const requiredComponents = [
            'gameContentScraper',
            'websiteMonitor',
            'scraperCompliance',
            'cms',
            'updateManager'
        ];

        return new Promise((resolve) => {
            const checkComponents = () => {
                const allLoaded = requiredComponents.every(component => window[component]);
                if (allLoaded) {
                    resolve();
                } else {
                    setTimeout(checkComponents, 100);
                }
            };
            checkComponents();
        });
    }

    /**
     * 设置集成
     */
    setupIntegrations() {
        // Twitter集成
        this.setupTwitterIntegration();

        // Discord集成
        this.setupDiscordIntegration();

        // 网站监控集成
        this.setupWebsiteIntegration();

        // Reddit集成（可选）
        this.setupRedditIntegration();
    }

    /**
     * 设置Twitter集成
     */
    setupTwitterIntegration() {
        // 监听Twitter抓取结果
        document.addEventListener('newCodesScraped', (event) => {
            const { source, codes } = event.detail;
            if (source === 'twitter' && this.integrations.twitter.enabled) {
                this.processScrapedContent('twitter', codes);
            }
        });
    }

    /**
     * 设置Discord集成
     */
    setupDiscordIntegration() {
        // 监听Discord新消息
        document.addEventListener('newDiscordCode', (event) => {
            if (this.integrations.discord.enabled) {
                this.processScrapedContent('discord', [event.detail]);
            }
        });

        // 监听Discord Webhook
        this.setupDiscordWebhookListener();
    }

    /**
     * 设置网站监控集成
     */
    setupWebsiteIntegration() {
        // 监听网站变化
        document.addEventListener('newWebsiteCode', (event) => {
            if (this.integrations.website.enabled) {
                this.processScrapedContent('website', [event.detail]);
            }
        });

        // 监听新闻更新
        document.addEventListener('newsUpdate', (event) => {
            this.processNewsUpdate(event.detail);
        });

        // 监听事件更新
        document.addEventListener('eventUpdate', (event) => {
            this.processEventUpdate(event.detail);
        });

        // 监听版本更新
        document.addEventListener('versionUpdate', (event) => {
            this.processVersionUpdate(event.detail);
        });
    }

    /**
     * 设置Reddit集成
     */
    setupRedditIntegration() {
        document.addEventListener('newCodesScraped', (event) => {
            const { source, codes } = event.detail;
            if (source === 'reddit' && this.integrations.reddit.enabled) {
                this.processScrapedContent('reddit', codes);
            }
        });
    }

    /**
     * 设置Discord Webhook监听器
     */
    setupDiscordWebhookListener() {
        // 这个函数会创建一个简单的webhook服务器
        // 在实际部署中，这应该在后端实现
        setInterval(() => {
            this.checkDiscordWebhook();
        }, 30000); // 每30秒检查一次
    }

    /**
     * 检查Discord Webhook
     */
    async checkDiscordWebhook() {
        try {
            // 调用后端API检查新的Discord消息
            const response = await fetch('/api/discord/check-messages');
            if (response.ok) {
                const messages = await response.json();
                messages.forEach(message => {
                    this.processDiscordMessage(message);
                });
            }
        } catch (error) {
            // 忽略错误，可能是后端未启动
        }
    }

    /**
     * 处理Discord消息
     */
    processDiscordMessage(message) {
        const codes = this.extractCodesFromText(message.content);
        if (codes.length > 0) {
            codes.forEach(code => {
                const codeData = {
                    code: code,
                    source: 'discord',
                    author: message.author,
                    channel: message.channel,
                    foundAt: message.timestamp
                };
                this.processScrapedContent('discord', [codeData]);
            });
        }
    }

    /**
     * 处理抓取到的内容
     */
    async processScrapedContent(source, contentItems) {
        console.log(`🔄 Processing ${contentItems.length} items from ${source}`);

        try {
            // 添加到处理队列
            for (const item of contentItems) {
                await this.processingQueue.add({
                    type: 'content',
                    source,
                    data: item,
                    priority: this.integrations[source]?.priority || 3
                });
            }

            // 启动处理
            this.processingQueue.start();

            // 记录分析
            this.analytics.recordProcessing(source, contentItems.length);

        } catch (error) {
            console.error(`Error processing content from ${source}:`, error);
            this.analytics.recordError(source, error);
        }
    }

    /**
     * 处理新闻更新
     */
    async processNewsUpdate(newsInfo) {
        try {
            await this.processingQueue.add({
                type: 'news',
                data: newsInfo,
                priority: 2
            });

            this.processingQueue.start();
            this.analytics.recordProcessing('news', 1);

        } catch (error) {
            console.error('Error processing news update:', error);
        }
    }

    /**
     * 处理事件更新
     */
    async processEventUpdate(eventInfo) {
        try {
            await this.processingQueue.add({
                type: 'event',
                data: eventInfo,
                priority: 2
            });

            this.processingQueue.start();
            this.analytics.recordProcessing('event', 1);

        } catch (error) {
            console.error('Error processing event update:', error);
        }
    }

    /**
     * 处理版本更新
     */
    async processVersionUpdate(versionInfo) {
        try {
            await this.processingQueue.add({
                type: 'version',
                data: versionInfo,
                priority: 1
            });

            this.processingQueue.start();
            this.analytics.recordProcessing('version', 1);

            // 版本更新需要立即通知
            this.notificationManager.sendVersionUpdate(versionInfo);

        } catch (error) {
            console.error('Error processing version update:', error);
        }
    }

    /**
     * 从文本提取兑换码
     */
    extractCodesFromText(text) {
        const codes = [];
        const codePatterns = [
            /\b([A-Z0-9]{8,20})\b/g,
            /\b(GIFT|CODE|PROMO)[-_]?([A-Z0-9]{6,16})\b/gi
        ];

        codePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const code = match[1] || match[0];
                if (this.isValidCode(code)) {
                    codes.push(code);
                }
            }
        });

        return [...new Set(codes)]; // 去重
    }

    /**
     * 验证兑换码
     */
    isValidCode(code) {
        if (code.length < 6 || code.length > 25) return false;
        const excludeWords = ['AND', 'THE', 'FOR', 'WITH'];
        return !excludeWords.includes(code);
    }

    /**
     * 启动自动集成
     */
    startAutoIntegration() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('🚀 Auto Content Integration started');

        // 定期协调所有组件
        setInterval(() => {
            this.coordinateComponents();
        }, 60000); // 每分钟协调一次

        // 立即执行一次协调
        setTimeout(() => {
            this.coordinateComponents();
        }, 5000);
    }

    /**
     * 协调所有组件
     */
    async coordinateComponents() {
        if (!this.isRunning) return;

        try {
            console.log('🔄 Coordinating content integration...');

            // 检查各组件状态
            const status = this.checkComponentStatus();
            this.analytics.recordComponentStatus(status);

            // 触发抓取（如果需要）
            await this.triggerScheduledScraping();

            // 更新最后集成时间
            this.lastIntegration = new Date().toISOString();

        } catch (error) {
            console.error('Error coordinating components:', error);
            this.analytics.recordError('coordination', error);
        }
    }

    /**
     * 检查组件状态
     */
    checkComponentStatus() {
        return {
            scraper: !!this.components.scraper,
            websiteMonitor: !!this.components.websiteMonitor,
            compliance: !!this.components.compliance,
            cms: !!this.components.cms,
            updateManager: !!this.components.updateManager,
            processingQueue: this.processingQueue.getStatus()
        };
    }

    /**
     * 触发计划抓取
     */
    async triggerScheduledScraping() {
        const now = new Date();
        const hour = now.getHours();

        // 根据时间调整抓取频率
        if (hour >= 9 && hour <= 21) { // 白天更频繁
            if (Math.random() < 0.3) { // 30%概率触发
                await this.triggerScraping();
            }
        } else { // 夜间降低频率
            if (Math.random() < 0.1) { // 10%概率触发
                await this.triggerScraping();
            }
        }
    }

    /**
     * 触发抓取
     */
    async triggerScraping() {
        const sources = [];

        if (this.integrations.twitter.enabled) sources.push('twitter');
        if (this.integrations.discord.enabled) sources.push('discord');
        if (this.integrations.website.enabled) sources.push('website');
        if (this.integrations.reddit.enabled) sources.push('reddit');

        for (const source of sources) {
            try {
                switch (source) {
                    case 'twitter':
                    case 'reddit':
                        if (this.components.scraper) {
                            this.components.scraper.manualScrape(source);
                        }
                        break;
                    case 'website':
                        if (this.components.websiteMonitor) {
                            this.components.websiteMonitor.performAllChecks();
                        }
                        break;
                    case 'discord':
                        // Discord通过webhook自动处理
                        break;
                }

                // 抓取间隔
                await this.wait(3000);
            } catch (error) {
                console.error(`Error triggering scraping for ${source}:`, error);
            }
        }
    }

    /**
     * 等待
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 手动触发集成
        document.addEventListener('triggerIntegration', () => {
            this.coordinateComponents();
        });

        // 更新集成配置
        document.addEventListener('updateIntegrationConfig', (event) => {
            const config = event.detail;
            if (config.integrations) {
                Object.assign(this.integrations, config.integrations);
                this.saveIntegrationConfig();
            }
        });

        // 监听处理队列完成
        this.processingQueue.onComplete((result) => {
            this.handleProcessingComplete(result);
        });

        // 监听处理错误
        this.processingQueue.onError((error) => {
            this.handleProcessingError(error);
        });
    }

    /**
     * 处理完成
     */
    handleProcessingComplete(result) {
        console.log(`✅ Processing completed: ${result.type} from ${result.source}`);

        // 发送通知
        if (result.type === 'content') {
            this.notificationManager.sendNewContentNotification(result);
        }

        // 更新统计
        this.analytics.recordCompletion(result.source, result.type);

        // 触发UI更新
        this.updateUI(result);
    }

    /**
     * 处理错误
     */
    handleProcessingError(error) {
        console.error('❌ Processing error:', error);
        this.analytics.recordError('processing', error);

        // 发送错误通知
        this.notificationManager.sendErrorNotification(error);
    }

    /**
     * 更新UI
     */
    updateUI(result) {
        // 如果有新的兑换码，更新UI
        if (result.type === 'content' && result.data && result.data.code) {
            this.updateCodeUI(result.data);
        }

        // 通知其他组件
        const event = new CustomEvent('contentProcessed', {
            detail: result
        });
        document.dispatchEvent(event);
    }

    /**
     * 更新兑换码UI
     */
    updateCodeUI(codeData) {
        // 更新主页的兑换码显示
        const codesSection = document.getElementById('codes');
        if (codesSection) {
            // 可以在这里动态添加新的兑换码显示
            console.log(`New code added to UI: ${codeData.code}`);
        }
    }

    /**
     * 获取集成状态
     */
    getIntegrationStatus() {
        return {
            isRunning: this.isRunning,
            lastIntegration: this.lastIntegration,
            integrations: this.integrations,
            componentStatus: this.checkComponentStatus(),
            queueStatus: this.processingQueue.getStatus(),
            analytics: this.analytics.getSummary(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 加载集成配置
     */
    loadIntegrationConfig() {
        try {
            const stored = localStorage.getItem('auto_content_integrator_config');
            if (stored) {
                const config = JSON.parse(stored);
                Object.assign(this.integrations, config.integrations);
            }
        } catch (error) {
            console.error('Failed to load integration config:', error);
        }
    }

    /**
     * 保存集成配置
     */
    saveIntegrationConfig() {
        try {
            const config = {
                integrations: this.integrations,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('auto_content_integrator_config', JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save integration config:', error);
        }
    }

    /**
     * 停止集成
     */
    stop() {
        this.isRunning = false;
        this.processingQueue.stop();
        console.log('Auto Content Integration stopped');
    }

    /**
     * 重启集成
     */
    restart() {
        this.stop();
        setTimeout(() => {
            this.startAutoIntegration();
        }, 1000);
    }
}

/**
 * 处理队列
 */
class ProcessingQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 3;
        this.currentProcessing = 0;
        this.completedCallbacks = [];
        this.errorCallbacks = [];
    }

    async add(item) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                ...item,
                resolve,
                reject,
                addedAt: Date.now()
            });

            // 按优先级排序
            this.queue.sort((a, b) => a.priority - b.priority);
        });
    }

    async start() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
            const item = this.queue.shift();
            this.currentProcessing++;

            this.processItem(item)
                .then(result => {
                    item.resolve(result);
                    this.completedCallbacks.forEach(callback => callback(result));
                })
                .catch(error => {
                    item.reject(error);
                    this.errorCallbacks.forEach(callback => callback(error));
                })
                .finally(() => {
                    this.currentProcessing--;
                });
        }

        if (this.currentProcessing === 0) {
            this.processing = false;
        }
    }

    async processItem(item) {
        console.log(`Processing ${item.type} from ${item.source}`);

        try {
            switch (item.type) {
                case 'content':
                    return await this.processContentItem(item);
                case 'news':
                    return await this.processNewsItem(item);
                case 'event':
                    return await this.processEventItem(item);
                case 'version':
                    return await this.processVersionItem(item);
                default:
                    throw new Error(`Unknown item type: ${item.type}`);
            }
        } catch (error) {
            console.error(`Error processing item:`, error);
            throw error;
        }
    }

    async processContentItem(item) {
        const content = item.data;

        // 验证内容
        if (!window.autoContentIntegrator.contentValidator.validate(content)) {
            throw new Error('Content validation failed');
        }

        // 添加到CMS
        if (window.cms) {
            await window.cms.addNewCode({
                code: content.code,
                rewards: content.rewards || 'Various rewards',
                description: content.description || `Auto-scraped from ${item.source}`,
                expires: content.expires || this.getDefaultExpiry(),
                priority: this.determinePriority(content, item.source)
            });
        }

        return {
            success: true,
            type: item.type,
            source: item.source,
            data: content,
            processedAt: new Date().toISOString()
        };
    }

    async processNewsItem(item) {
        const news = item.data;

        // 存储新闻
        await this.storeNews(news);

        return {
            success: true,
            type: item.type,
            source: 'website',
            data: news,
            processedAt: new Date().toISOString()
        };
    }

    async processEventItem(item) {
        const event = item.data;

        // 存储事件
        await this.storeEvent(event);

        return {
            success: true,
            type: item.type,
            source: 'website',
            data: event,
            processedAt: new Date().toISOString()
        };
    }

    async processVersionItem(item) {
        const version = item.data;

        // 存储版本信息
        await this.storeVersion(version);

        return {
            success: true,
            type: item.type,
            source: 'website',
            data: version,
            processedAt: new Date().toISOString()
        };
    }

    determinePriority(content, source) {
        if (source === 'discord' || source === 'twitter') {
            return 'high';
        } else if (source === 'website') {
            return 'medium';
        } else {
            return 'low';
        }
    }

    getDefaultExpiry() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }

    async storeNews(news) {
        const existingNews = JSON.parse(localStorage.getItem('integrated_news') || '[]');
        existingNews.unshift(news);
        localStorage.setItem('integrated_news', JSON.stringify(existingNews.slice(0, 100)));
    }

    async storeEvent(event) {
        const existingEvents = JSON.parse(localStorage.getItem('integrated_events') || '[]');
        existingEvents.unshift(event);
        localStorage.setItem('integrated_events', JSON.stringify(existingEvents.slice(0, 50)));
    }

    async storeVersion(version) {
        const existingVersions = JSON.parse(localStorage.getItem('integrated_versions') || '[]');
        existingVersions.unshift(version);
        localStorage.setItem('integrated_versions', JSON.stringify(existingVersions.slice(0, 20)));
    }

    onComplete(callback) {
        this.completedCallbacks.push(callback);
    }

    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    getStatus() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            currentProcessing: this.currentProcessing,
            maxConcurrent: this.maxConcurrent
        };
    }

    stop() {
        this.processing = false;
    }
}

/**
 * 集成内容验证器
 */
class IntegratedContentValidator {
    validate(content) {
        if (!content || !content.code) {
            return false;
        }

        // 基础验证
        if (content.code.length < 6 || content.code.length > 25) {
            return false;
        }

        // 检查重复
        if (this.isDuplicate(content.code)) {
            return false;
        }

        // 内容质量检查
        if (content.confidence && content.confidence < 0.6) {
            return false;
        }

        return true;
    }

    isDuplicate(code) {
        // 检查CMS中是否已存在
        if (window.cms && window.cms.codesData) {
            const existing = window.cms.codesData.active.find(c => c.code === code);
            return !!existing;
        }
        return false;
    }
}

/**
 * 集成通知管理器
 */
class IntegratedNotificationManager {
    sendNewContentNotification(result) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎁 New Content Available', {
                body: `New ${result.data.code} found from ${result.source}`,
                icon: '/assets/icons/favicon.svg',
                tag: 'new-content'
            });
        }

        // 发送自定义事件
        const event = new CustomEvent('newContentNotification', {
            detail: result
        });
        document.dispatchEvent(event);
    }

    sendVersionUpdate(versionInfo) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔄 Game Update Available', {
                body: `Version ${versionInfo.version} is now available`,
                icon: '/assets/icons/favicon.svg',
                tag: 'version-update'
            });
        }
    }

    sendErrorNotification(error) {
        console.error('Integration error:', error);
    }
}

/**
 * 集成分析
 */
class IntegrationAnalytics {
    constructor() {
        this.stats = {
            processing: {},
            errors: [],
            componentStatus: [],
            completions: {}
        };
    }

    recordProcessing(source, count) {
        if (!this.stats.processing[source]) {
            this.stats.processing[source] = 0;
        }
        this.stats.processing[source] += count;
    }

    recordError(source, error) {
        this.stats.errors.push({
            source,
            error: error.message,
            timestamp: new Date().toISOString()
        });

        // 保留最近100个错误
        if (this.stats.errors.length > 100) {
            this.stats.errors = this.stats.errors.slice(-100);
        }
    }

    recordComponentStatus(status) {
        this.stats.componentStatus.push({
            ...status,
            timestamp: new Date().toISOString()
        });

        // 保留最近50个状态记录
        if (this.stats.componentStatus.length > 50) {
            this.stats.componentStatus = this.stats.componentStatus.slice(-50);
        }
    }

    recordCompletion(source, type) {
        const key = `${source}-${type}`;
        if (!this.stats.completions[key]) {
            this.stats.completions[key] = 0;
        }
        this.stats.completions[key]++;
    }

    getSummary() {
        const totalProcessed = Object.values(this.stats.processing).reduce((sum, count) => sum + count, 0);
        const totalCompleted = Object.values(this.stats.completions).reduce((sum, count) => sum + count, 0);

        return {
            totalProcessed,
            totalCompleted,
            successRate: totalProcessed > 0 ? (totalCompleted / totalProcessed * 100).toFixed(2) : 0,
            recentErrors: this.stats.errors.slice(-10),
            componentHealth: this.getComponentHealth()
        };
    }

    getComponentHealth() {
        if (this.stats.componentStatus.length === 0) {
            return 'unknown';
        }

        const recent = this.stats.componentStatus.slice(-5);
        const healthyCount = recent.filter(status =>
            status.scraper && status.websiteMonitor && status.compliance
        ).length;

        if (healthyCount === recent.length) {
            return 'excellent';
        } else if (healthyCount >= recent.length * 0.8) {
            return 'good';
        } else if (healthyCount >= recent.length * 0.5) {
            return 'fair';
        } else {
            return 'poor';
        }
    }
}

// 导出集成器实例
window.autoContentIntegrator = new AutoContentIntegrator();
window.AutoContentIntegrator = AutoContentIntegrator;

// 全局函数
window.triggerIntegration = () => {
    window.autoContentIntegrator.coordinateComponents();
};

window.getIntegrationStatus = () => {
    return window.autoContentIntegrator.getIntegrationStatus();
};

console.log('Auto Content Integrator loaded successfully');