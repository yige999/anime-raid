/**
 * Game Content Scraper - 游戏内容自动抓取系统
 * 自动从官方社交媒体、网站等渠道抓取最新兑换码和游戏信息
 *
 * 重要提示：
 * 1. 请遵守各平台的robots.txt和使用条款
 * 2. 合理设置抓取频率，避免对官方服务器造成压力
 * 3. 仅抓取公开信息，尊重版权
 * 4. 建议联系官方获得API授权
 */

class GameContentScraper {
    constructor() {
        this.sources = {
            twitter: {
                enabled: true,
                lastCheck: null,
                interval: 1800000, // 30分钟
                keywords: ['anime raid code', 'animeraid', 'anime raid gift']
            },
            discord: {
                enabled: true,
                lastCheck: null,
                interval: 1800000, // 30分钟
                channels: ['announcements', 'updates', 'gift-codes']
            },
            officialWebsite: {
                enabled: true,
                lastCheck: null,
                interval: 3600000, // 1小时
                urls: [
                    'https://animeraidgame.com/news',
                    'https://animeraidgame.com/events',
                    'https://animeraidgame.com/codes'
                ]
            },
            reddit: {
                enabled: true,
                lastCheck: null,
                interval: 3600000, // 1小时
                subreddits: ['AnimeRaid', 'animeraid']
            }
        };

        this.scrapedData = new Map();
        this.cacheManager = new ScrapedDataCache();
        this.rateLimiter = new RateLimiter();
        this.contentValidator = new ContentValidator();

        this.init();
    }

    /**
     * 初始化抓取器
     */
    init() {
        this.loadStoredData();
        this.startPeriodicScraping();
        this.setupEventHandlers();
        console.log('Game Content Scraper initialized');
    }

    /**
     * 启动定期抓取
     */
    startPeriodicScraping() {
        // 每5分钟检查一次是否需要抓取
        setInterval(() => {
            this.performScheduledScraping();
        }, 300000);

        // 启动时立即执行一次
        setTimeout(() => {
            this.performScheduledScraping();
        }, 5000);
    }

    /**
     * 执行计划抓取
     */
    async performScheduledScraping() {
        const now = Date.now();

        // 检查每个数据源
        for (const [source, config] of Object.entries(this.sources)) {
            if (!config.enabled) continue;

            if (this.shouldScrape(source, config, now)) {
                try {
                    await this.scrapeSource(source);
                    config.lastCheck = now;
                } catch (error) {
                    console.error(`Failed to scrape ${source}:`, error);
                    this.handleScrapingError(source, error);
                }
            }
        }
    }

    /**
     * 检查是否应该抓取
     */
    shouldScrape(source, config, now) {
        if (!config.lastCheck) return true;
        return (now - config.lastCheck) >= config.interval;
    }

    /**
     * 抓取指定数据源
     */
    async scrapeSource(source) {
        console.log(`Starting to scrape ${source}...`);

        switch (source) {
            case 'twitter':
                await this.scrapeTwitter();
                break;
            case 'discord':
                await this.scrapeDiscord();
                break;
            case 'officialWebsite':
                await this.scrapeOfficialWebsite();
                break;
            case 'reddit':
                await this.scrapeReddit();
                break;
        }
    }

    /**
     * 抓取Twitter内容
     * 注意：由于Twitter API限制，这里使用代理方案
     */
    async scrapeTwitter() {
        const config = this.sources.twitter;

        try {
            // 方案1：使用Twitter API v2（需要API密钥）
            // const tweets = await this.fetchTwitterAPI(config.keywords);

            // 方案2：使用Nitter实例（开源Twitter前端）
            const tweets = await this.fetchFromNitter(config.keywords);

            const newCodes = this.extractCodesFromTweets(tweets);
            await this.processScrapedCodes('twitter', newCodes);

        } catch (error) {
            console.error('Twitter scraping failed:', error);
            throw error;
        }
    }

    /**
     * 从Nitter实例获取Twitter内容
     */
    async fetchFromNitter(keywords) {
        const nitterInstance = 'https://nitter.net'; // 可以使用其他实例
        const searchUrl = `${nitterInstance}/search?q=${encodeURIComponent(keywords.join(' OR '))}&f=tweets`;

        try {
            // 使用CORS代理或后端API
            const response = await this.fetchWithProxy(searchUrl);
            const html = await response.text();
            return this.parseTweetsFromHTML(html);
        } catch (error) {
            console.error('Nitter fetch failed:', error);
            return [];
        }
    }

    /**
     * 从HTML解析推文内容
     */
    parseTweetsFromHTML(html) {
        const tweets = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 查找推文元素
        const tweetElements = doc.querySelectorAll('.timeline-item');

        tweetElements.forEach(element => {
            const tweet = {
                id: this.extractTweetId(element),
                content: this.extractTweetContent(element),
                author: this.extractTweetAuthor(element),
                timestamp: this.extractTweetTimestamp(element),
                url: this.extractTweetUrl(element)
            };

            if (tweet.content && tweet.author) {
                tweets.push(tweet);
            }
        });

        return tweets;
    }

    /**
     * 抓取Discord内容
     * 注意：需要Discord Bot令牌或Webhook
     */
    async scrapeDiscord() {
        const config = this.sources.discord;

        try {
            // 方案1：使用Discord Bot API
            // const messages = await this.fetchDiscordMessages(config.channels);

            // 方案2：监控公开的Discord Webhook
            const announcements = await this.fetchDiscordAnnouncements();

            const newCodes = this.extractCodesFromDiscord(announcements);
            await this.processScrapedCodes('discord', newCodes);

        } catch (error) {
            console.error('Discord scraping failed:', error);
            throw error;
        }
    }

    /**
     * 获取Discord公告
     */
    async fetchDiscordAnnouncements() {
        // 这里需要根据实际的Discord服务器配置
        // 可以使用Discord.js库或Discord API

        // 模拟实现
        return [
            {
                id: 'mock_announcement_1',
                content: '🎉 New gift code: GAME2025 - Valid until next week!',
                author: 'Official Bot',
                timestamp: new Date().toISOString(),
                channel: 'announcements'
            }
        ];
    }

    /**
     * 抓取官方网站
     */
    async scrapeOfficialWebsite() {
        const config = this.sources.officialWebsite;
        const allCodes = [];

        for (const url of config.urls) {
            try {
                const response = await this.fetchWithProxy(url);
                const html = await response.text();
                const codes = this.extractCodesFromWebsite(html, url);
                allCodes.push(...codes);

                // 请求间隔，避免过于频繁
                await this.rateLimiter.wait();
            } catch (error) {
                console.error(`Failed to scrape ${url}:`, error);
            }
        }

        await this.processScrapedCodes('website', allCodes);
    }

    /**
     * 从网站HTML提取兑换码
     */
    extractCodesFromWebsite(html, sourceUrl) {
        const codes = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 查找可能的兑换码元素
        const codeElements = doc.querySelectorAll([
            '.code-box',
            '.gift-code',
            '.promo-code',
            '[class*="code"]',
            '[class*="promo"]'
        ].join(','));

        codeElements.forEach(element => {
            const code = this.extractCodeFromElement(element);
            if (code) {
                codes.push({
                    ...code,
                    source: 'website',
                    sourceUrl: sourceUrl,
                    foundAt: new Date().toISOString()
                });
            }
        });

        // 在文本中搜索兑换码模式
        const textContent = doc.body.textContent || '';
        const textCodes = this.extractCodesFromText(textContent);
        textCodes.forEach(code => {
            codes.push({
                code: code.code,
                description: code.description,
                source: 'website',
                sourceUrl: sourceUrl,
                foundAt: new Date().toISOString(),
                confidence: code.confidence
            });
        });

        return codes;
    }

    /**
     * 抓取Reddit内容
     */
    async scrapeReddit() {
        const config = this.sources.reddit;
        const allCodes = [];

        for (const subreddit of config.subreddits) {
            try {
                const url = `https://www.reddit.com/r/${subreddit}/search.json?q=code+OR+gift+OR+promo&sort=new&limit=25`;
                const response = await this.fetchWithProxy(url);
                const data = await response.json();

                const codes = this.extractCodesFromReddit(data.data.children);
                allCodes.push(...codes);

                await this.rateLimiter.wait();
            } catch (error) {
                console.error(`Failed to scrape r/${subreddit}:`, error);
            }
        }

        await this.processScrapedCodes('reddit', allCodes);
    }

    /**
     * 从Reddit数据提取兑换码
     */
    extractCodesFromReddit(posts) {
        const codes = [];

        posts.forEach(post => {
            const postData = post.data;
            const textCodes = this.extractCodesFromText(`${postData.title} ${postData.selftext}`);

            textCodes.forEach(code => {
                codes.push({
                    ...code,
                    source: 'reddit',
                    sourceUrl: `https://reddit.com${postData.permalink}`,
                    author: postData.author,
                    subreddit: postData.subreddit,
                    foundAt: new Date(postData.created_utc * 1000).toISOString()
                });
            });
        });

        return codes;
    }

    /**
     * 从推文内容提取兑换码
     */
    extractCodesFromTweets(tweets) {
        const codes = [];

        tweets.forEach(tweet => {
            const textCodes = this.extractCodesFromText(tweet.content);
            textCodes.forEach(code => {
                codes.push({
                    ...code,
                    source: 'twitter',
                    sourceUrl: tweet.url,
                    author: tweet.author,
                    foundAt: tweet.timestamp
                });
            });
        });

        return codes;
    }

    /**
     * 从Discord消息提取兑换码
     */
    extractCodesFromDiscord(messages) {
        const codes = [];

        messages.forEach(message => {
            const textCodes = this.extractCodesFromText(message.content);
            textCodes.forEach(code => {
                codes.push({
                    ...code,
                    source: 'discord',
                    sourceUrl: `discord://channels/${message.channel}/${message.id}`,
                    author: message.author,
                    channel: message.channel,
                    foundAt: message.timestamp
                });
            });
        });

        return codes;
    }

    /**
     * 从文本中提取兑换码
     * 使用正则表达式匹配常见的兑换码格式
     */
    extractCodesFromText(text) {
        const codes = [];

        // 兑换码模式（大写字母和数字，通常8-20个字符）
        const codePatterns = [
            /\b([A-Z0-9]{8,20})\b/g, // 基础模式
            /\b(GIFT|CODE|PROMO)[-_]?([A-Z0-9]{6,16})\b/gi, // 带前缀
            /\b([A-Z]{3,}[-_]?[0-9]{3,})\b/g, // 字母数字组合
            /['""]([A-Z0-9]{8,20})['""]/g, // 引号包围
        ];

        codePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const code = match[1] || match[0];

                if (this.isValidCode(code) && !this.isDuplicateCode(code)) {
                    codes.push({
                        code: code,
                        description: this.extractCodeContext(text, code),
                        confidence: this.calculateCodeConfidence(code, text),
                        extractedAt: new Date().toISOString()
                    });
                }
            }
        });

        return codes;
    }

    /**
     * 验证兑换码有效性
     */
    isValidCode(code) {
        // 长度检查
        if (code.length < 6 || code.length > 25) return false;

        // 排除常见单词
        const excludeWords = ['AND', 'THE', 'FOR', 'WITH', 'HAVE', 'THIS', 'THAT', 'FROM', 'THEY', 'BEEN'];
        if (excludeWords.includes(code)) return false;

        // 必须包含至少一个数字或大写字母
        const hasNumber = /\d/.test(code);
        const hasLetter = /[A-Z]/.test(code);

        return hasNumber || hasLetter;
    }

    /**
     * 检查是否为重复兑换码
     */
    isDuplicateCode(code) {
        const storedCodes = this.cacheManager.getStoredCodes();
        return storedCodes.some(stored => stored.code === code);
    }

    /**
     * 提取兑换码上下文
     */
    extractCodeContext(text, code) {
        const beforeText = text.substring(Math.max(0, text.indexOf(code) - 100), text.indexOf(code));
        const afterText = text.substring(text.indexOf(code) + code.length, Math.min(text.length, text.indexOf(code) + code.length + 100));

        return {
            before: beforeText.trim(),
            after: afterText.trim(),
            full: `${beforeText} ${code} ${afterText}`.trim()
        };
    }

    /**
     * 计算兑换码置信度
     */
    calculateCodeConfidence(code, text) {
        let confidence = 0.5; // 基础置信度

        // 长度适中加分
        if (code.length >= 8 && code.length <= 16) confidence += 0.2;

        // 包含数字加分
        if (/\d/.test(code)) confidence += 0.1;

        // 上下文有关键词加分
        const contextKeywords = ['code', 'gift', 'promo', 'redeem', 'claim', 'reward', 'free'];
        const hasKeywords = contextKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
        if (hasKeywords) confidence += 0.2;

        // 格式规范加分
        if (/^[A-Z0-9_-]+$/.test(code)) confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    /**
     * 处理抓取到的兑换码
     */
    async processScrapedCodes(source, codes) {
        if (codes.length === 0) {
            console.log(`No new codes found from ${source}`);
            return;
        }

        console.log(`Found ${codes.length} potential codes from ${source}`);

        // 验证和过滤
        const validCodes = codes.filter(codeData =>
            codeData.confidence > 0.6 && this.contentValidator.validateCode(codeData)
        );

        if (validCodes.length === 0) {
            console.log(`No valid codes from ${source} after validation`);
            return;
        }

        // 存储到缓存
        for (const codeData of validCodes) {
            await this.cacheManager.storeCode(codeData);
        }

        // 通知更新系统
        this.notifyNewCodes(source, validCodes);

        console.log(`Successfully processed ${validCodes.length} codes from ${source}`);
    }

    /**
     * 通知新兑换码
     */
    notifyNewCodes(source, codes) {
        const event = new CustomEvent('newCodesScraped', {
            detail: { source, codes, timestamp: Date.now() }
        });
        document.dispatchEvent(event);

        // 如果有全局的CMS系统，通知它
        if (window.cms) {
            codes.forEach(codeData => {
                window.cms.addNewCode({
                    code: codeData.code,
                    rewards: this.extractRewardsFromContext(codeData.description),
                    description: `Auto-scraped from ${source}`,
                    expires: this.estimateExpiryFromContext(codeData.description),
                    priority: codeData.confidence > 0.8 ? 'high' : 'medium'
                });
            });
        }
    }

    /**
     * 从上下文提取奖励信息
     */
    extractRewardsFromContext(context) {
        const rewardKeywords = {
            'gem': '💎 Gems',
            'diamond': '💎 Diamonds',
            'gold': '💰 Gold',
            'coin': '💰 Coins',
            'ticket': '🎫 Tickets',
            'potion': '🧪 Potions',
            'energy': '⚡ Energy',
            'stamina': '💪 Stamina'
        };

        let rewards = 'Various rewards';

        for (const [keyword, reward] of Object.entries(rewardKeywords)) {
            if (context.toLowerCase().includes(keyword)) {
                rewards = reward;
                break;
            }
        }

        return rewards;
    }

    /**
     * 从上下文估算过期时间
     */
    estimateExpiryFromContext(context) {
        const timePatterns = {
            '24 hour': this.getDateFromDays(1),
            '48 hour': this.getDateFromDays(2),
            '3 day': this.getDateFromDays(3),
            'week': this.getDateFromDays(7),
            '2 week': this.getDateFromDays(14),
            'month': this.getDateFromDays(30)
        };

        for (const [pattern, date] of Object.entries(timePatterns)) {
            if (context.toLowerCase().includes(pattern)) {
                return date;
            }
        }

        // 默认30天后过期
        return this.getDateFromDays(30);
    }

    /**
     * 从天数获取日期
     */
    getDateFromDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    /**
     * 使用代理获取内容
     */
    async fetchWithProxy(url) {
        // 方案1：使用CORS代理
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;

        // 方案2：使用自建代理
        // const proxyUrl = `https://your-proxy-server.com/proxy?url=${encodeURIComponent(url)}`;

        // 方案3：后端API代理
        // const response = await fetch('/api/proxy', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ url })
        // });

        try {
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                }
            });
            return response;
        } catch (error) {
            console.error('Proxy fetch failed, trying direct:', error);
            return await fetch(url);
        }
    }

    /**
     * 处理抓取错误
     */
    handleScrapingError(source, error) {
        console.error(`Scraping error for ${source}:`, error);

        // 记录错误
        this.cacheManager.logError(source, error);

        // 如果频繁失败，暂时禁用该数据源
        const errorCount = this.cacheManager.getErrorCount(source);
        if (errorCount > 5) {
            console.log(`Temporarily disabling ${source} due to repeated errors`);
            this.sources[source].enabled = false;

            // 1小时后重新启用
            setTimeout(() => {
                this.sources[source].enabled = true;
                this.cacheManager.clearErrors(source);
            }, 3600000);
        }
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 监听手动触发抓取
        document.addEventListener('triggerScraping', (event) => {
            const source = event.detail.source;
            if (source) {
                this.scrapeSource(source);
            } else {
                this.performScheduledScraping();
            }
        });

        // 监听配置更新
        document.addEventListener('updateScrapingConfig', (event) => {
            const { source, config } = event.detail;
            if (this.sources[source]) {
                this.sources[source] = { ...this.sources[source], ...config };
                this.saveConfig();
            }
        });
    }

    /**
     * 加载存储的数据
     */
    loadStoredData() {
        try {
            const stored = localStorage.getItem('scraper_config');
            if (stored) {
                const config = JSON.parse(stored);
                Object.assign(this.sources, config.sources);
            }
        } catch (error) {
            console.error('Failed to load scraper config:', error);
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        try {
            const config = { sources: this.sources };
            localStorage.setItem('scraper_config', JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save scraper config:', error);
        }
    }

    /**
     * 获取抓取统计
     */
    getScrapingStats() {
        return {
            sources: this.sources,
            stats: this.cacheManager.getStats(),
            lastRun: this.cacheManager.getLastRun(),
            errorCount: this.cacheManager.getTotalErrors()
        };
    }

    /**
     * 手动触发抓取
     */
    async manualScrape(source = null) {
        if (source) {
            await this.scrapeSource(source);
        } else {
            await this.performScheduledScraping();
        }
    }
}

/**
 * 抓取数据缓存管理器
 */
class ScrapedDataCache {
    constructor() {
        this.cacheKey = 'scraped_data_cache';
        this.errorKey = 'scraping_errors';
        this.statsKey = 'scraping_stats';
    }

    async storeCode(codeData) {
        try {
            const cache = this.getCache();
            cache.codes.push(codeData);

            // 保持最近1000条记录
            if (cache.codes.length > 1000) {
                cache.codes = cache.codes.slice(-1000);
            }

            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Failed to store scraped code:', error);
        }
    }

    getStoredCodes() {
        const cache = this.getCache();
        return cache.codes || [];
    }

    getCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            return cached ? JSON.parse(cached) : { codes: [] };
        } catch (error) {
            console.error('Failed to get cache:', error);
            return { codes: [] };
        }
    }

    logError(source, error) {
        try {
            const errors = this.getErrors();
            errors.push({
                source,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            localStorage.setItem(this.errorKey, JSON.stringify(errors));
        } catch (error) {
            console.error('Failed to log error:', error);
        }
    }

    getErrors() {
        try {
            const errors = localStorage.getItem(this.errorKey);
            return errors ? JSON.parse(errors) : [];
        } catch (error) {
            return [];
        }
    }

    getErrorCount(source) {
        const errors = this.getErrors();
        return errors.filter(e => e.source === source).length;
    }

    clearErrors(source) {
        const errors = this.getErrors().filter(e => e.source !== source);
        localStorage.setItem(this.errorKey, JSON.stringify(errors));
    }

    getStats() {
        try {
            const stats = localStorage.getItem(this.statsKey);
            return stats ? JSON.parse(stats) : {};
        } catch (error) {
            return {};
        }
    }

    getLastRun() {
        const stats = this.getStats();
        return stats.lastRun || null;
    }

    getTotalErrors() {
        return this.getErrors().length;
    }
}

/**
 * 速率限制器
 */
class RateLimiter {
    constructor() {
        this.lastRequest = 0;
        this.minInterval = 2000; // 最小请求间隔2秒
    }

    async wait() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequest = Date.now();
    }
}

/**
 * 内容验证器
 */
class ContentValidator {
    validateCode(codeData) {
        // 检查是否为有效格式
        if (!codeData.code || codeData.code.length < 6) return false;

        // 检查是否包含不当内容
        const blacklist = ['spam', 'abuse', 'inappropriate'];
        const hasBlacklist = blacklist.some(word =>
            codeData.description.toLowerCase().includes(word)
        );
        if (hasBlacklist) return false;

        // 检查置信度
        if (codeData.confidence < 0.6) return false;

        return true;
    }
}

// 导出抓取器实例
window.gameContentScraper = new GameContentScraper();
window.GameContentScraper = GameContentScraper;

// 全局触发抓取函数
window.triggerScraping = (source = null) => {
    window.gameContentScraper.manualScrape(source);
};

console.log('Game Content Scraper loaded successfully');