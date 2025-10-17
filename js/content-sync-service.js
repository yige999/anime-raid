/**
 * Anime Raid Content Sync Service
 * 自动内容同步服务
 *
 * 功能：
 * - 定期同步外部资源内容
 * - 内容去重和优化
 * - 变更检测和通知
 * - 数据备份和恢复
 */
class ContentSyncService {
    constructor() {
        this.config = null;
        this.isRunning = false;
        this.syncIntervals = new Map();
        this.lastSyncTimes = new Map();
        this.syncStats = {
            totalSyncs: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            lastSyncTime: null,
            errors: []
        };

        // 内容处理器映射
        this.contentProcessors = {
            codes: new CodeContentProcessor(),
            tierlist: new TierListContentProcessor(),
            news: new NewsContentProcessor(),
            youtube: new YouTubeContentProcessor()
        };
    }

    /**
     * 初始化同步服务
     */
    async initialize() {
        console.log('🔄 初始化内容同步服务...');

        try {
            // 加载配置
            await this.loadConfig();

            // 检查同步设置
            if (this.config.settings.sync.enabled) {
                await this.startSyncService();
            }

            // 加载之前的统计数据
            this.loadSyncStats();

            console.log('✅ 内容同步服务初始化完成');
        } catch (error) {
            console.error('❌ 内容同步服务初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载配置文件
     */
    async loadConfig() {
        try {
            const response = await fetch('./config/external-resources.json');
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status}`);
            }

            this.config = await response.json();
            console.log('📋 配置文件加载成功');
        } catch (error) {
            console.warn('⚠️ 配置文件加载失败，使用默认配置');
            this.config = this.getDefaultConfig();
        }
    }

    /**
     * 启动同步服务
     */
    async startSyncService() {
        if (this.isRunning) {
            console.log('⚠️ 同步服务已在运行');
            return;
        }

        console.log('🚀 启动自动同步服务...');
        this.isRunning = true;

        // 设置定期同步任务
        this.setupSyncIntervals();

        // 执行首次同步
        await this.performFullSync();

        console.log('✅ 自动同步服务已启动');
    }

    /**
     * 设置同步间隔
     */
    setupSyncIntervals() {
        const intervals = this.config.settings.sync.intervals;

        // 代码同步 - 每小时
        this.setupInterval('codes', intervals.codes, () => this.syncContent('codes'));

        // Tier列表同步 - 每天
        this.setupInterval('tierlist', intervals.tierlist, () => this.syncContent('tierlist'));

        // 新闻同步 - 每6小时
        this.setupInterval('news', intervals.news, () => this.syncContent('news'));

        // YouTube同步 - 每天
        this.setupInterval('youtube', intervals.youtube, () => this.syncContent('youtube'));
    }

    /**
     * 设置单个同步间隔
     */
    setupInterval(type, interval, syncFunction) {
        // 清除现有间隔
        if (this.syncIntervals.has(type)) {
            clearInterval(this.syncIntervals.get(type));
        }

        // 设置新间隔
        const intervalId = setInterval(async () => {
            try {
                await syncFunction();
                this.updateSyncStats(type, 'success');
            } catch (error) {
                console.error(`❌ ${type} 同步失败:`, error);
                this.updateSyncStats(type, 'error', error);
            }
        }, interval);

        this.syncIntervals.set(type, intervalId);
        console.log(`⏰ ${type} 同步间隔已设置: ${interval / 1000 / 60} 分钟`);
    }

    /**
     * 执行完整同步
     */
    async performFullSync() {
        console.log('🔄 开始完整内容同步...');

        const syncTasks = ['codes', 'tierlist', 'news', 'youtube'].map(type =>
            this.syncContent(type).catch(error => {
                console.error(`❌ ${type} 同步失败:`, error);
                return { type, error: error.message };
            })
        );

        const results = await Promise.allSettled(syncTasks);

        // 统计结果
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ 完整同步完成: ${successful} 成功, ${failed} 失败`);

        // 通知用户
        this.notifySyncComplete(successful, failed);
    }

    /**
     * 同步特定类型的内容
     */
    async syncContent(type) {
        console.log(`🔄 开始同步 ${type} 内容...`);

        const processor = this.contentProcessors[type];
        if (!processor) {
            throw new Error(`未找到 ${type} 内容处理器`);
        }

        try {
            // 获取该类型的所有启用的源
            const sources = this.getEnabledSources(type);
            console.log(`📡 找到 ${sources.length} 个 ${type} 源`);

            // 并行处理所有源
            const sourceResults = await Promise.allSettled(
                sources.map(source => this.syncSource(source, processor))
            );

            // 整合结果
            const consolidatedContent = processor.consolidate(sourceResults);

            // 保存内容
            await this.saveContent(type, consolidatedContent);

            // 记录同步时间
            this.lastSyncTimes.set(type, new Date().toISOString());

            console.log(`✅ ${type} 内容同步完成`);

            // 触发更新事件
            this.dispatchEvent('contentUpdated', { type, content: consolidatedContent });

            return consolidatedContent;

        } catch (error) {
            console.error(`❌ ${type} 内容同步失败:`, error);
            throw error;
        }
    }

    /**
     * 同步单个源
     */
    async syncSource(source, processor) {
        console.log(`📡 同步源: ${source.name}`);

        try {
            // 检查缓存
            const cacheKey = `${source.type}_${source.name}`;
            const cachedData = this.getCachedData(cacheKey);

            if (cachedData && !this.isCacheExpired(cachedData, source.updateFrequency)) {
                console.log(`💾 使用缓存数据: ${source.name}`);
                return {
                    source: source.name,
                    data: cachedData.content,
                    fromCache: true,
                    timestamp: cachedData.timestamp
                };
            }

            // 获取新数据
            const content = await processor.fetchFromSource(source);

            // 保存到缓存
            this.setCachedData(cacheKey, content);

            return {
                source: source.name,
                data: content,
                fromCache: false,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ 同步源 ${source.name} 失败:`, error);
            throw error;
        }
    }

    /**
     * 获取启用的源
     */
    getEnabledSources(type) {
        const sources = [];

        // 遍历配置中的所有源
        Object.values(this.config.sources).forEach(category => {
            Object.values(category).forEach(source => {
                if (source.enabled && (source.type === type || type === 'all')) {
                    sources.push(source);
                }
            });
        });

        // 按优先级排序
        return sources.sort((a, b) => a.priority - b.priority);
    }

    /**
     * 保存内容
     */
    async saveContent(type, content) {
        try {
            const data = {
                content: content,
                lastUpdate: new Date().toISOString(),
                sourceCount: Array.isArray(content) ? content.length : Object.keys(content).length,
                version: this.config.version
            };

            // 保存到 localStorage
            localStorage.setItem(`anime-raid-${type}`, JSON.stringify(data));

            // 保存到 memory cache
            if (window.externalResourceManager) {
                window.externalResourceManager.contentCache.set(type, data);
            }

            console.log(`💾 ${type} 内容已保存`);
        } catch (error) {
            console.error(`❌ 保存 ${type} 内容失败:`, error);
            throw error;
        }
    }

    /**
     * 缓存管理
     */
    getCachedData(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('⚠️ 缓存读取失败:', error);
            return null;
        }
    }

    setCachedData(key, content) {
        try {
            const cacheData = {
                content: content,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ 缓存写入失败:', error);
        }
    }

    isCacheExpired(cachedData, updateFrequency) {
        if (!cachedData || !cachedData.timestamp) return true;

        const cacheTime = new Date(cachedData.timestamp);
        const now = new Date();
        const age = now - cacheTime;

        return age > updateFrequency;
    }

    /**
     * 更新同步统计
     */
    updateSyncStats(type, result, error = null) {
        this.syncStats.totalSyncs++;

        if (result === 'success') {
            this.syncStats.successfulSyncs++;
            this.syncStats.lastSyncTime = new Date().toISOString();
        } else {
            this.syncStats.failedSyncs++;
            if (error) {
                this.syncStats.errors.push({
                    type,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                // 只保留最近50个错误
                if (this.syncStats.errors.length > 50) {
                    this.syncStats.errors = this.syncStats.errors.slice(-50);
                }
            }
        }

        this.saveSyncStats();
    }

    /**
     * 保存统计数据
     */
    saveSyncStats() {
        try {
            localStorage.setItem('sync-stats', JSON.stringify(this.syncStats));
        } catch (error) {
            console.warn('⚠️ 保存同步统计失败:', error);
        }
    }

    /**
     * 加载统计数据
     */
    loadSyncStats() {
        try {
            const saved = localStorage.getItem('sync-stats');
            if (saved) {
                this.syncStats = { ...this.syncStats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('⚠️ 加载同步统计失败:', error);
        }
    }

    /**
     * 获取同步状态
     */
    getSyncStatus() {
        return {
            isRunning: this.isRunning,
            stats: this.syncStats,
            lastSyncTimes: Object.fromEntries(this.lastSyncTimes),
            activeIntervals: Array.from(this.syncIntervals.keys())
        };
    }

    /**
     * 停止同步服务
     */
    stopSyncService() {
        console.log('🛑 停止同步服务...');

        // 清除所有间隔
        this.syncIntervals.forEach((intervalId, type) => {
            clearInterval(intervalId);
            console.log(`⏹️ 已停止 ${type} 同步间隔`);
        });

        this.syncIntervals.clear();
        this.isRunning = false;

        console.log('✅ 同步服务已停止');
    }

    /**
     * 通知同步完成
     */
    notifySyncComplete(successful, failed) {
        // 控制台通知
        console.log(`📊 同步报告: ${successful} 成功, ${failed} 失败`);

        // 浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Anime Raid Wiki', {
                body: `内容同步完成: ${successful} 成功, ${failed} 失败`,
                icon: '/assets/icons/favicon.svg'
            });
        }

        // 触发自定义事件
        this.dispatchEvent('syncComplete', { successful, failed });
    }

    /**
     * 触发自定义事件
     */
    dispatchEvent(eventName, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        }
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
        return {
            version: "1.0.0",
            sources: {},
            settings: {
                sync: {
                    enabled: true,
                    intervals: {
                        codes: 3600000,
                        tierlist: 86400000,
                        news: 21600000,
                        youtube: 86400000
                    }
                }
            }
        };
    }
}

/**
 * 代码内容处理器
 */
class CodeContentProcessor {
    async fetchFromSource(source) {
        // 模拟代码获取
        return {
            codes: [
                {
                    code: 'DEMO2025',
                    rewards: 'Diamonds x1000, Gold x50000',
                    status: 'active',
                    expiry: '2025-02-01',
                    source: source.name
                }
            ]
        };
    }

    consolidate(results) {
        const allCodes = new Map();

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { source, data } = result.value;

                if (data.codes) {
                    data.codes.forEach(code => {
                        const key = code.code;
                        if (!allCodes.has(key)) {
                            allCodes.set(key, { ...code, sources: [source] });
                        } else {
                            allCodes.get(key).sources.push(source);
                        }
                    });
                }
            }
        });

        return Array.from(allCodes.values());
    }
}

/**
 * Tier列表内容处理器
 */
class TierListContentProcessor {
    async fetchFromSource(source) {
        // 模拟Tier列表获取
        return {
            tiers: [
                {
                    tier: 'S',
                    units: [
                        { name: 'Demo Unit', element: 'Fire', rating: 4.5, source: source.name }
                    ]
                }
            ]
        };
    }

    consolidate(results) {
        const units = new Map();

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { source, data } = result.value;

                if (data.tiers) {
                    data.tiers.forEach(tier => {
                        tier.units.forEach(unit => {
                            const key = unit.name;
                            if (!units.has(key)) {
                                units.set(key, {
                                    ...unit,
                                    rankings: [{ tier: tier.tier, source }],
                                    averageRating: unit.rating
                                });
                            } else {
                                const existing = units.get(key);
                                existing.rankings.push({ tier: tier.tier, source });
                                existing.averageRating = (existing.averageRating + unit.rating) / 2;
                            }
                        });
                    });
                }
            }
        });

        return Array.from(units.values());
    }
}

/**
 * 新闻内容处理器
 */
class NewsContentProcessor {
    async fetchFromSource(source) {
        // 模拟新闻获取
        return {
            articles: [
                {
                    title: 'Demo Update',
                    url: 'https://example.com',
                    summary: 'Demo news article',
                    publishedAt: new Date().toISOString(),
                    source: source.name
                }
            ]
        };
    }

    consolidate(results) {
        const articles = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { data } = result.value;
                if (data.articles) {
                    articles.push(...data.articles);
                }
            }
        });

        // 按发布时间排序
        return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
}

/**
 * YouTube内容处理器
 */
class YouTubeContentProcessor {
    async fetchFromSource(source) {
        // 模拟YouTube视频获取
        return {
            videos: [
                {
                    title: 'Demo Video',
                    videoId: 'demo123',
                    publishedAt: new Date().toISOString(),
                    source: source.name
                }
            ]
        };
    }

    consolidate(results) {
        const videos = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { data } = result.value;
                if (data.videos) {
                    videos.push(...data.videos);
                }
            }
        });

        // 按发布时间排序
        return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
}

// 导出服务
window.ContentSyncService = ContentSyncService;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.contentSyncService = new ContentSyncService();
        await window.contentSyncService.initialize();
    });
}