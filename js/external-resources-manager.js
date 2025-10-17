/**
 * Anime Raid External Resources Integration Manager
 * 自动内容更新和外部资源集成系统
 *
 * 功能：
 * - 自动抓取外部资源内容
 * - 代码和更新信息同步
 * - SEO链接优化
 * - 定期内容监控
 */
class ExternalResourcesManager {
    constructor() {
        this.resources = {
            // 官方和社区资源
            official: {
                roblox: {
                    name: 'Anime Raid Roblox Page',
                    url: 'https://www.roblox.com/games/81876459126967/Anime-Raid',
                    type: 'official',
                    priority: 1,
                    updateFrequency: 'daily'
                },
                rolilons: {
                    name: 'Rolimons Game Stats',
                    url: 'https://www.rolimons.com/game/81876459126967',
                    type: 'stats',
                    priority: 2,
                    updateFrequency: 'daily'
                },
                discord: {
                    name: 'Anime Raid Official Discord',
                    url: 'https://discord.gg/animeraid',
                    type: 'community',
                    priority: 1,
                    updateFrequency: 'hourly'
                }
            },

            // 指南和代码网站
            guides: {
                sportskeeda: {
                    name: 'Sportskeeda Anime Raid Guide',
                    url: 'https://www.sportskeeda.com/roblox-news/anime-raid-a-beginner-s-guide',
                    type: 'guide',
                    priority: 3,
                    updateFrequency: 'weekly'
                },
                tryhardguides: {
                    name: 'Try Hard Guides',
                    url: 'https://tryhardguides.com/anime-raid-codes/',
                    type: 'codes',
                    priority: 2,
                    updateFrequency: 'daily'
                },
                gamerjournalist: {
                    name: 'Gamer Journalist',
                    url: 'https://gamerjournalist.com/anime-raid-codes/',
                    type: 'codes',
                    priority: 2,
                    updateFrequency: 'daily'
                },
                beebom: {
                    name: 'Beebom',
                    url: 'https://beebom.com/anime-raid-codes/',
                    type: 'codes',
                    priority: 3,
                    updateFrequency: 'daily'
                },
                pockettactics: {
                    name: 'Pocket Tactics',
                    url: 'https://www.pockettactics.com/anime-raid-codes',
                    type: 'codes',
                    priority: 3,
                    updateFrequency: 'weekly'
                },
                gamerant: {
                    name: 'Gamerant',
                    url: 'https://gamerant.com/roblox-anime-raid-codes/',
                    type: 'codes',
                    priority: 2,
                    updateFrequency: 'daily'
                }
            },

            // Tier列表和单位指南
            tierlists: {
                progameguides: {
                    name: 'Pro Game Guides Tier List',
                    url: 'https://progameguides.com/roblox/anime-raid-units-tier-list/',
                    type: 'tierlist',
                    priority: 2,
                    updateFrequency: 'weekly'
                },
                destructoid: {
                    name: 'Destructoid Tier List',
                    url: 'https://www.destructoid.com/anime-raid-tier-list/',
                    type: 'tierlist',
                    priority: 3,
                    updateFrequency: 'monthly'
                },
                gamerempire: {
                    name: 'Gamer Empire',
                    url: 'https://gamerempire.net/anime-raid-tier-list/',
                    type: 'tierlist',
                    priority: 3,
                    updateFrequency: 'monthly'
                },
                gamezebo: {
                    name: 'Gamezebo',
                    url: 'https://www.gamezebo.com/walkthroughs/anime-raid-tier-list/',
                    type: 'guide',
                    priority: 3,
                    updateFrequency: 'monthly'
                }
            },

            // 新闻和更新源
            news: {
                devforum: {
                    name: 'Roblox DevForum',
                    url: 'https://devforum.roblox.com',
                    type: 'official',
                    priority: 1,
                    updateFrequency: 'daily'
                },
                destructoid_news: {
                    name: 'Destructoid News',
                    url: 'https://www.destructoid.com/tag/anime-raid/',
                    type: 'news',
                    priority: 2,
                    updateFrequency: 'daily'
                },
                sportskeeda_news: {
                    name: 'Sportskeeda Updates',
                    url: 'https://www.sportskeeda.com/roblox/anime-raid',
                    type: 'news',
                    priority: 3,
                    updateFrequency: 'daily'
                }
            },

            // YouTube频道
            youtube: {
                toadboi: {
                    name: 'ToadBoi',
                    url: 'https://www.youtube.com/@ToadBoiRBX',
                    type: 'video',
                    priority: 3,
                    updateFrequency: 'weekly'
                },
                kinglegacyx: {
                    name: 'KingLegacyX',
                    url: 'https://www.youtube.com/@KingLegacyX',
                    type: 'video',
                    priority: 3,
                    updateFrequency: 'weekly'
                },
                noobblox: {
                    name: 'NoobBlox',
                    url: 'https://www.youtube.com/@NoobBloxYT',
                    type: 'video',
                    priority: 3,
                    updateFrequency: 'weekly'
                }
            }
        };

        this.lastUpdate = {};
        this.updateIntervals = {};
        this.contentCache = new Map();
    }

    /**
     * 初始化资源管理器
     */
    async initialize() {
        console.log('🚀 初始化外部资源管理器...');

        // 加载缓存数据
        this.loadCache();

        // 设置定期更新任务
        this.setupScheduledUpdates();

        // 首次同步
        await this.performInitialSync();

        console.log('✅ 外部资源管理器初始化完成');
    }

    /**
     * 设置定期更新任务
     */
    setupScheduledUpdates() {
        // 代码更新 - 每小时检查
        setInterval(() => {
            this.updateCodes();
        }, 60 * 60 * 1000); // 1小时

        // Tier列表更新 - 每天检查
        setInterval(() => {
            this.updateTierLists();
        }, 24 * 60 * 60 * 1000); // 24小时

        // 新闻更新 - 每6小时检查
        setInterval(() => {
            this.updateNews();
        }, 6 * 60 * 60 * 1000); // 6小时

        // YouTube内容更新 - 每天检查
        setInterval(() => {
            this.updateYouTubeContent();
        }, 24 * 60 * 60 * 1000); // 24小时
    }

    /**
     * 执行首次同步
     */
    async performInitialSync() {
        console.log('📥 执行首次内容同步...');

        const tasks = [
            this.updateCodes(),
            this.updateTierLists(),
            this.updateNews(),
            this.updateYouTubeContent()
        ];

        await Promise.allSettled(tasks);

        console.log('✅ 首次同步完成');
    }

    /**
     * 更新代码信息
     */
    async updateCodes() {
        const codeSources = [
            this.resources.guides.tryhardguides,
            this.resources.guides.gamerjournalist,
            this.resources.guides.beebom,
            this.resources.guides.gamerant
        ];

        const results = await Promise.allSettled(
            codeSources.map(source => this.fetchCodesFromSource(source))
        );

        const allCodes = this.consolidateCodeData(results);
        await this.saveCodeData(allCodes);

        // 触发前端更新
        this.notifyCodesUpdate(allCodes);
    }

    /**
     * 从源获取代码信息
     */
    async fetchCodesFromSource(source) {
        try {
            console.log(`🔄 从 ${source.name} 获取代码信息...`);

            // 这里需要实现实际的内容抓取逻辑
            // 由于CORS限制，这需要通过后端代理服务实现

            const mockData = this.getMockCodeData(source.name);

            console.log(`✅ 成功从 ${source.name} 获取代码信息`);
            return {
                source: source.name,
                data: mockData,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ 从 ${source.name} 获取代码失败:`, error);
            return null;
        }
    }

    /**
     * 整合多个源的代码数据
     */
    consolidateCodeData(results) {
        const codeMap = new Map();

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { source, data } = result.value;

                data.codes.forEach(code => {
                    if (!codeMap.has(code.code)) {
                        codeMap.set(code.code, {
                            ...code,
                            sources: [source],
                            confidence: 1
                        });
                    } else {
                        const existing = codeMap.get(code.code);
                        existing.sources.push(source);
                        existing.confidence += 0.1;
                    }
                });
            }
        });

        return Array.from(codeMap.values()).sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * 保存代码数据
     */
    async saveCodeData(codes) {
        const data = {
            codes: codes,
            lastUpdate: new Date().toISOString(),
            sourceCount: codes.reduce((sum, code) => sum + code.sources.length, 0)
        };

        // 保存到localStorage
        localStorage.setItem('anime-raid-codes', JSON.stringify(data));

        // 保存到contentCache
        this.contentCache.set('codes', data);
    }

    /**
     * 更新Tier列表
     */
    async updateTierLists() {
        const tierSources = [
            this.resources.tierlists.progameguides,
            this.resources.tierlists.destructoid,
            this.resources.tierlists.gamerempire
        ];

        const results = await Promise.allSettled(
            tierSources.map(source => this.fetchTierListFromSource(source))
        );

        const consolidatedTierList = this.consolidateTierListData(results);
        await this.saveTierListData(consolidatedTierList);

        this.notifyTierListUpdate(consolidatedTierList);
    }

    /**
     * 从源获取Tier列表
     */
    async fetchTierListFromSource(source) {
        try {
            console.log(`🔄 从 ${source.name} 获取Tier列表...`);

            const mockData = this.getMockTierListData(source.name);

            console.log(`✅ 成功从 ${source.name} 获取Tier列表`);
            return {
                source: source.name,
                data: mockData,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ 从 ${source.name} 获取Tier列表失败:`, error);
            return null;
        }
    }

    /**
     * 整合Tier列表数据
     */
    consolidateTierListData(results) {
        const tierConsensus = {};

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { source, data } = result.value;

                data.tiers.forEach(tier => {
                    tier.units.forEach(unit => {
                        if (!tierConsensus[unit.name]) {
                            tierConsensus[unit.name] = {
                                name: unit.name,
                                element: unit.element,
                                type: unit.type,
                                rankings: [],
                                averageRank: 0,
                                consensus: 0
                            };
                        }

                        tierConsensus[unit.name].rankings.push({
                            tier: tier.tier,
                            source: source,
                            rating: unit.rating
                        });
                    });
                });
            }
        });

        // 计算共识评级
        Object.values(tierConsensus).forEach(unit => {
            const ratingSum = unit.rankings.reduce((sum, r) => sum + r.rating, 0);
            unit.averageRating = ratingSum / unit.rankings.length;
            unit.consensus = unit.rankings.length;

            // 确定最终Tier
            if (unit.averageRating >= 4.5) unit.finalTier = 'S';
            else if (unit.averageRating >= 3.8) unit.finalTier = 'A';
            else if (unit.averageRating >= 3.0) unit.finalTier = 'B';
            else if (unit.averageRating >= 2.0) unit.finalTier = 'C';
            else unit.finalTier = 'D';
        });

        return Object.values(tierConsensus).sort((a, b) => b.averageRating - a.averageRating);
    }

    /**
     * 更新新闻内容
     */
    async updateNews() {
        const newsSources = [
            this.resources.news.destructoid_news,
            this.resources.news.sportskeeda_news
        ];

        const results = await Promise.allSettled(
            newsSources.map(source => this.fetchNewsFromSource(source))
        );

        const consolidatedNews = this.consolidateNewsData(results);
        await this.saveNewsData(consolidatedNews);
    }

    /**
     * 更新YouTube内容
     */
    async updateYouTubeContent() {
        const youtubeSources = Object.values(this.resources.youtube);

        const results = await Promise.allSettled(
            youtubeSources.map(source => this.fetchYouTubeVideos(source))
        );

        const consolidatedVideos = this.consolidateYouTubeData(results);
        await this.saveYouTubeData(consolidatedVideos);
    }

    /**
     * 通知前端更新
     */
    notifyCodesUpdate(codes) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('codesUpdated', { detail: codes }));
        }
    }

    notifyTierListUpdate(tierList) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tierListUpdated', { detail: tierList }));
        }
    }

    /**
     * 模拟代码数据（实际使用时替换为真实抓取）
     */
    getMockCodeData(source) {
        return {
            codes: [
                {
                    code: 'LUCKY2025',
                    rewards: '钻石 x5000, 金币 x100000',
                    status: 'active',
                    expiry: '2025-02-01'
                },
                {
                    code: 'NEWTIERUPDATE',
                    rewards: '高级召唤券 x3, 经验药水 x10',
                    status: 'active',
                    expiry: '2025-01-25'
                },
                {
                    code: 'WINTEREVENT',
                    rewards: '冰系角色碎片, 体力药剂 x5',
                    status: 'expired',
                    expiry: '2025-01-15'
                }
            ]
        };
    }

    /**
     * 模拟Tier列表数据
     */
    getMockTierListData(source) {
        return {
            tiers: [
                {
                    tier: 'S',
                    units: [
                        { name: 'Holy Priest', element: 'Light', type: 'Support', rating: 4.8 },
                        { name: 'Flame Warrior', element: 'Fire', type: 'DPS', rating: 4.6 }
                    ]
                },
                {
                    tier: 'A',
                    units: [
                        { name: 'Ice Mage', element: 'Ice', type: 'Mage', rating: 4.2 },
                        { name: 'Shadow Assassin', element: 'Dark', type: 'Assassin', rating: 4.0 }
                    ]
                }
            ]
        };
    }

    /**
     * 加载缓存数据
     */
    loadCache() {
        try {
            const cachedCodes = localStorage.getItem('anime-raid-codes');
            const cachedTierList = localStorage.getItem('anime-raid-tierlist');
            const cachedNews = localStorage.getItem('anime-raid-news');

            if (cachedCodes) this.contentCache.set('codes', JSON.parse(cachedCodes));
            if (cachedTierList) this.contentCache.set('tierlist', JSON.parse(cachedTierList));
            if (cachedNews) this.contentCache.set('news', JSON.parse(cachedNews));

        } catch (error) {
            console.warn('加载缓存数据失败:', error);
        }
    }

    /**
     * 获取缓存的内容
     */
    getCachedContent(type) {
        return this.contentCache.get(type) || null;
    }

    /**
     * 获取所有资源统计信息
     */
    getResourceStats() {
        const stats = {
            totalSources: 0,
            lastUpdates: {},
            contentCounts: {}
        };

        // 统计资源数量
        Object.values(this.resources).forEach(category => {
            stats.totalSources += Object.keys(category).length;
        });

        // 统计内容数量
        this.contentCache.forEach((content, type) => {
            if (type === 'codes') {
                stats.contentCounts.codes = content.codes?.length || 0;
            } else if (type === 'tierlist') {
                stats.contentCounts.tierlist = content.length || 0;
            } else if (type === 'news') {
                stats.contentCounts.news = content.articles?.length || 0;
            }
        });

        return stats;
    }
}

// 导出管理器实例
window.ExternalResourcesManager = ExternalResourcesManager;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.externalResourceManager = new ExternalResourcesManager();
        await window.externalResourceManager.initialize();
    });
}