/**
 * Anime Raid SEO Link Optimizer
 * SEO链接优化和权威来源集成系统
 *
 * 功能：
 * - 自动生成权威来源引用
 * - 优化外部链接结构
 * - 提升搜索引擎排名
 * - 增强网站可信度
 */
class SEOLinkOptimizer {
    constructor() {
        this.authoritativeSources = {
            // 官方来源
            official: [
                {
                    name: 'Anime Raid Official',
                    url: 'https://www.roblox.com/games/81876459126967/Anime-Raid',
                    type: 'official',
                    weight: 10,
                    anchorTexts: ['Anime Raid', 'official game', 'Roblox Anime Raid']
                },
                {
                    name: 'Anime Raid Discord',
                    url: 'https://discord.gg/animeraid',
                    type: 'community',
                    weight: 9,
                    anchorTexts: ['Anime Raid Discord', 'official Discord', 'community server']
                }
            ],

            // 权威游戏媒体
            gamingMedia: [
                {
                    name: 'Pro Game Guides',
                    url: 'https://progameguides.com/roblox/anime-raid-units-tier-list/',
                    type: 'tierlist',
                    weight: 8,
                    anchorTexts: ['Anime Raid tier list', 'unit rankings', 'best characters']
                },
                {
                    name: 'Gamerant',
                    url: 'https://gamerant.com/roblox-anime-raid-codes/',
                    type: 'codes',
                    weight: 8,
                    anchorTexts: ['Anime Raid codes', 'working codes', 'redeem codes']
                },
                {
                    name: 'Sportskeeda',
                    url: 'https://www.sportskeeda.com/roblox/anime-raid',
                    type: 'news',
                    weight: 7,
                    anchorTexts: ['Anime Raid updates', 'game news', 'patch notes']
                }
            ],

            // 专业指南网站
            guideSites: [
                {
                    name: 'Try Hard Guides',
                    url: 'https://tryhardguides.com/anime-raid-codes/',
                    type: 'codes',
                    weight: 7,
                    anchorTexts: ['active codes', 'code list', 'reward codes']
                },
                {
                    name: 'Pocket Tactics',
                    url: 'https://www.pockettactics.com/anime-raid-codes',
                    type: 'codes',
                    weight: 6,
                    anchorTexts: ['Roblox codes', 'game codes', 'redeem codes']
                }
            ],

            // YouTube内容创作者
            youtubeCreators: [
                {
                    name: 'ToadBoi',
                    url: 'https://www.youtube.com/@ToadBoiRBX',
                    type: 'video',
                    weight: 6,
                    anchorTexts: ['ToadBoi Anime Raid', 'gameplay videos', 'unit showcases']
                },
                {
                    name: 'KingLegacyX',
                    url: 'https://www.youtube.com/@KingLegacyX',
                    type: 'video',
                    weight: 6,
                    anchorTexts: ['KingLegacyX', 'code updates', 'tier list videos']
                }
            ]
        };

        this.linkContexts = {
            codes: {
                keywords: ['codes', 'redeem', 'rewards', 'free', 'items', 'currency'],
                preferredSources: ['gamingMedia', 'guideSites'],
                maxLinks: 3
            },
            tierlist: {
                keywords: ['tier list', 'rankings', 'best', 'meta', 'units', 'characters'],
                preferredSources: ['gamingMedia', 'youtubeCreators'],
                maxLinks: 4
            },
            guides: {
                keywords: ['guide', 'how to', 'tutorial', 'tips', 'strategy'],
                preferredSources: ['gamingMedia', 'guideSites', 'youtubeCreators'],
                maxLinks: 5
            },
            news: {
                keywords: ['updates', 'news', 'patch', 'events', 'new'],
                preferredSources: ['gamingMedia', 'official'],
                maxLinks: 3
            }
        };

        this.generatedLinks = new Map();
        this.linkPerformance = new Map();
    }

    /**
     * 初始化SEO优化器
     */
    initialize() {
        console.log('🔍 初始化SEO链接优化器...');
        this.setupLinkTracking();
        this.optimizeExistingLinks();
        console.log('✅ SEO链接优化器初始化完成');
    }

    /**
     * 为内容生成权威来源引用
     */
    generateAuthoritativeLinks(contentType, keywords = []) {
        const context = this.linkContexts[contentType];
        if (!context) return [];

        const relevantSources = this.findRelevantSources(contentType, keywords);
        const links = this.optimizeLinkSelection(relevantSources, context.maxLinks);

        // 生成多种锚文本变化
        return links.map(source => this.generateLinkVariation(source, contentType));
    }

    /**
     * 查找相关来源
     */
    findRelevantSources(contentType, keywords) {
        const context = this.linkContexts[contentType];
        const allSources = [
            ...this.authoritativeSources.official,
            ...this.authoritativeSources[officialSources[context.preferredSources[0]] || []],
            ...this.authoritativeSources[officialSources[context.preferredSources[1]] || []]
        ];

        // 基于关键词匹配度排序
        return allSources
            .filter(source => this.isSourceRelevant(source, keywords))
            .sort((a, b) => this.calculateRelevanceScore(b, keywords) - this.calculateRelevanceScore(a, keywords));
    }

    /**
     * 计算来源相关性得分
     */
    calculateRelevanceScore(source, keywords) {
        let score = source.weight;

        // 关键词匹配加分
        keywords.forEach(keyword => {
            source.anchorTexts.forEach(anchorText => {
                if (anchorText.toLowerCase().includes(keyword.toLowerCase())) {
                    score += 2;
                }
            });
        });

        // 内容类型匹配加分
        if (source.type === this.getContentTypeFromKeywords(keywords)) {
            score += 3;
        }

        return score;
    }

    /**
     * 生成链接变化
     */
    generateLinkVariation(source, contentType) {
        const anchors = source.anchorTexts;
        const selectedAnchor = anchors[Math.floor(Math.random() * anchors.length)];

        return {
            url: source.url,
            anchorText: selectedAnchor,
            title: `Learn more about ${selectedAnchor} at ${source.name}`,
            rel: this.generateRelAttributes(source),
            source: source.name,
            type: source.type,
            weight: source.weight
        };
    }

    /**
     * 生成rel属性
     */
    generateRelAttributes(source) {
        const rels = [];

        if (source.type === 'external') {
            rels.push('noopener');
            rels.push('noreferrer');
        }

        if (source.weight >= 8) {
            // 高权重来源，可以考虑sponsored
            // rels.push('sponsored');
        }

        return rels.join(' ');
    }

    /**
     * 优化现有链接
     */
    optimizeExistingLinks() {
        // 查找页面中的外部链接
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([data-optimized])');

        externalLinks.forEach(link => {
            this.optimizeLink(link);
        });
    }

    /**
     * 优化单个链接
     */
    optimizeLink(link) {
        const url = link.href;
        const source = this.findSourceByUrl(url);

        if (source) {
            // 添加优化属性
            link.setAttribute('rel', this.generateRelAttributes(source));
            link.setAttribute('title', `Visit ${source.name} for more information`);
            link.setAttribute('data-source', source.name);
            link.setAttribute('data-optimized', 'true');

            // 添加性能跟踪
            this.addLinkTracking(link, source);
        }

        // 添加外部链接标识
        if (!url.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
        }
    }

    /**
     * 根据URL查找来源
     */
    findSourceByUrl(url) {
        for (const category of Object.values(this.authoritativeSources)) {
            for (const source of category) {
                if (url.includes(source.url) || source.url.includes(url)) {
                    return source;
                }
            }
        }
        return null;
    }

    /**
     * 添加链接跟踪
     */
    addLinkTracking(link, source) {
        link.addEventListener('click', (e) => {
            this.trackLinkClick(source, link.textContent);
        });
    }

    /**
     * 跟踪链接点击
     */
    trackLinkClick(source, anchorText) {
        const key = `${source.name}_${anchorText}`;

        if (!this.linkPerformance.has(key)) {
            this.linkPerformance.set(key, {
                clicks: 0,
                source: source.name,
                anchorText: anchorText,
                lastClicked: null
            });
        }

        const performance = this.linkPerformance.get(key);
        performance.clicks++;
        performance.lastClicked = new Date().toISOString();

        // 保存到localStorage
        this.saveLinkPerformance();

        // 发送分析事件
        this.sendAnalyticsEvent('outbound_link_click', {
            source: source.name,
            anchorText: anchorText,
            url: source.url
        });
    }

    /**
     * 生成结构化数据引用
     */
    generateStructuredDataReferences() {
        const references = [];

        // 为每个权威来源生成引用
        Object.values(this.authoritativeSources).flat().forEach(source => {
            references.push({
                '@type': 'WebPage',
                name: source.name,
                url: source.url,
                description: `Authoritative source for ${source.type} content about Anime Raid`
            });
        });

        return {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: references.map((ref, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: ref
            }))
        };
    }

    /**
     * 生成SEO友好的引用列表
     */
    generateReferenceList(contentType) {
        const links = this.generateAuthoritativeLinks(contentType);
        const referenceList = document.createElement('div');
        referenceList.className = 'seo-references mt-8 p-4 bg-gray-50 rounded-lg';
        referenceList.innerHTML = `
            <h3 class="text-lg font-semibold mb-3">📚 Authoritative Sources</h3>
            <div class="grid md:grid-cols-2 gap-3">
                ${links.map(link => `
                    <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                        </svg>
                        <a href="${link.url}"
                           target="_blank"
                           rel="${link.rel}"
                           title="${link.title}"
                           class="text-blue-600 hover:text-blue-800 underline text-sm">
                           ${link.anchorText}
                        </a>
                        <span class="text-xs text-gray-500">(${link.source})</span>
                    </div>
                `).join('')}
            </div>
            <p class="text-xs text-gray-600 mt-3">
                These external resources provide additional insights and updates about Anime Raid.
                We recommend checking them regularly for the latest information.
            </p>
        `;

        return referenceList;
    }

    /**
     * 获取链接性能报告
     */
    getLinkPerformanceReport() {
        const report = {
            totalClicks: 0,
            topSources: [],
            recentActivity: []
        };

        // 计算总点击数
        this.linkPerformance.forEach((performance, key) => {
            report.totalClicks += performance.clicks;
        });

        // 获取热门来源
        const sourceClicks = {};
        this.linkPerformance.forEach((performance, key) => {
            if (!sourceClicks[performance.source]) {
                sourceClicks[performance.source] = 0;
            }
            sourceClicks[performance.source] += performance.clicks;
        });

        report.topSources = Object.entries(sourceClicks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([source, clicks]) => ({ source, clicks }));

        // 获取最近活动
        const recent = Array.from(this.linkPerformance.entries())
            .filter(([key, performance]) => performance.lastClicked)
            .sort((a, b) => new Date(b[1].lastClicked) - new Date(a[1].lastClicked))
            .slice(0, 5)
            .map(([key, performance]) => ({
                source: performance.source,
                anchorText: performance.anchorText,
                lastClicked: performance.lastClicked
            }));

        report.recentActivity = recent;

        return report;
    }

    /**
     * 发送分析事件
     */
    sendAnalyticsEvent(eventName, data) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }

        // 其他分析平台可以在这里添加
        console.log('Analytics Event:', eventName, data);
    }

    /**
     * 保存链接性能数据
     */
    saveLinkPerformance() {
        try {
            const data = Array.from(this.linkPerformance.entries());
            localStorage.setItem('seo-link-performance', JSON.stringify(data));
        } catch (error) {
            console.warn('保存链接性能数据失败:', error);
        }
    }

    /**
     * 加载链接性能数据
     */
    loadLinkPerformance() {
        try {
            const data = localStorage.getItem('seo-link-performance');
            if (data) {
                const parsed = JSON.parse(data);
                this.linkPerformance = new Map(parsed);
            }
        } catch (error) {
            console.warn('加载链接性能数据失败:', error);
        }
    }

    /**
     * 设置链接跟踪
     */
    setupLinkTracking() {
        this.loadLinkPerformance();
    }

    /**
     * 辅助方法：判断来源是否相关
     */
    isSourceRelevant(source, keywords) {
        const hasKeywordMatch = keywords.some(keyword =>
            source.anchorTexts.some(anchor =>
                anchor.toLowerCase().includes(keyword.toLowerCase())
            )
        );

        const hasTypeMatch = keywords.some(keyword =>
            source.type.toLowerCase().includes(keyword.toLowerCase())
        );

        return hasKeywordMatch || hasTypeMatch;
    }

    /**
     * 辅助方法：根据关键词获取内容类型
     */
    getContentTypeFromKeywords(keywords) {
        for (const [type, context] of Object.entries(this.linkContexts)) {
            if (keywords.some(keyword =>
                context.keywords.some(contextKeyword =>
                    keyword.toLowerCase().includes(contextKeyword.toLowerCase())
                )
            )) {
                return type;
            }
        }
        return 'general';
    }

    /**
     * 辅助方法：优化链接选择
     */
    optimizeLinkSelection(sources, maxLinks) {
        return sources.slice(0, maxLinks);
    }
}

// 导出SEO优化器
window.SEOLinkOptimizer = SEOLinkOptimizer;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.seoLinkOptimizer = new SEOLinkOptimizer();
        window.seoLinkOptimizer.initialize();
    });
}