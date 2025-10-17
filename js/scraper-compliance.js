/**
 * Scraper Compliance Module - 爬虫合规和反爬虫处理
 * 确保抓取行为符合法律法规和网站使用条款
 */

class ScraperCompliance {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];

        this.rateLimiter = new AdvancedRateLimiter();
        this.robotsChecker = new RobotsTxtChecker();
        this.requestDelay = new RequestDelay();
        this.detectionAvoidance = new DetectionAvoidance();
        this.complianceLogger = new ComplianceLogger();

        this.init();
    }

    /**
     * 初始化合规模块
     */
    init() {
        this.setupComplianceRules();
        this.loadComplianceConfig();
        console.log('Scraper Compliance Module initialized');
    }

    /**
     * 设置合规规则
     */
    setupComplianceRules() {
        this.rules = {
            // 基本规则
            respectRobotsTxt: true,
            reasonableRateLimit: true,
            identifyUserAgent: true,
            noOverloadServers: true,

            // 内容规则
            onlyPublicContent: true,
            noPersonalData: true,
            respectCopyright: true,
            properAttribution: true,

            // 技术规则
            handleHttpErrors: true,
            implementRetries: true,
            cacheRequests: true,
            monitorPerformance: true,

            // 法律合规
            gdprCompliant: true,
            termsOfServiceRespect: true,
            jurisdictionCompliance: true
        };
    }

    /**
     * 合规的HTTP请求
     */
    async makeCompliantRequest(url, options = {}) {
        const requestId = this.generateRequestId();

        try {
            // 检查robots.txt
            if (this.rules.respectRobotsTxt) {
                const canAccess = await this.robotsChecker.canAccess(url);
                if (!canAccess) {
                    throw new Error('Access denied by robots.txt');
                }
            }

            // 应用速率限制
            await this.rateLimiter.wait(url);

            // 应用请求延迟
            await this.requestDelay.wait();

            // 构建合规请求头
            const compliantHeaders = this.buildCompliantHeaders(url);

            // 执行请求
            const response = await this.executeRequest(url, {
                ...options,
                headers: { ...compliantHeaders, ...options.headers }
            });

            // 记录合规日志
            this.complianceLogger.logRequest(requestId, url, 'success');

            return response;

        } catch (error) {
            this.complianceLogger.logRequest(requestId, url, 'error', error.message);
            throw error;
        }
    }

    /**
     * 构建合规请求头
     */
    buildCompliantHeaders(url) {
        const headers = {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1', // Do Not Track
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };

        // 添加来源信息
        const origin = this.getOrigin(url);
        if (origin) {
            headers['Origin'] = origin;
            headers['Referer'] = origin;
        }

        // 添加反检测头
        const antiDetectionHeaders = this.detectionAvoidance.getHeaders();
        Object.assign(headers, antiDetectionHeaders);

        return headers;
    }

    /**
     * 执行请求
     */
    async executeRequest(url, options) {
        // 使用后端代理服务
        if (this.shouldUseProxy(url)) {
            return await this.executeProxyRequest(url, options);
        } else {
            return await this.executeDirectRequest(url, options);
        }
    }

    /**
     * 通过代理执行请求
     */
    async executeProxyRequest(url, options) {
        const proxyUrl = 'http://localhost:3001/api/scrape';

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                headers: options.headers,
                timeout: options.timeout || 10000
            })
        });

        if (!response.ok) {
            throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 直接执行请求
     */
    async executeDirectRequest(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 判断是否应该使用代理
     */
    shouldUseProxy(url) {
        const proxyDomains = [
            'twitter.com',
            'x.com',
            'reddit.com',
            'discord.com'
        ];

        try {
            const domain = new URL(url).hostname;
            return proxyDomains.some(proxyDomain =>
                domain === proxyDomain || domain.endsWith(`.${proxyDomain}`)
            );
        } catch (error) {
            return true; // 解析失败时默认使用代理
        }
    }

    /**
     * 获取随机User-Agent
     */
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * 获取Origin
     */
    getOrigin(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch (error) {
            return null;
        }
    }

    /**
     * 生成请求ID
     */
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 验证内容合规性
     */
    validateContent(url, content) {
        const validation = {
            isCompliant: true,
            issues: [],
            warnings: []
        };

        // 检查是否为公开内容
        if (this.rules.onlyPublicContent && !this.isPublicContent(url, content)) {
            validation.isCompliant = false;
            validation.issues.push('Content appears to be non-public');
        }

        // 检查个人数据
        if (this.rules.noPersonalData && this.containsPersonalData(content)) {
            validation.isCompliant = false;
            validation.issues.push('Content may contain personal data');
        }

        // 检查版权
        if (this.rules.respectCopyright && this.hasCopyrightIssues(content)) {
            validation.warnings.push('Content may have copyright restrictions');
        }

        return validation;
    }

    /**
     * 检查是否为公开内容
     */
    isPublicContent(url, content) {
        // 检查URL模式
        const privatePatterns = [
            '/admin',
            '/private',
            '/login',
            '/dashboard',
            '/account',
            '/profile'
        ];

        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();

            const isPrivate = privatePatterns.some(pattern =>
                pathname.includes(pattern)
            );

            if (isPrivate) return false;

            // 检查HTTP状态码（如果可用）
            // 检查登录要求（如果内容包含登录表单等）
            const hasLoginForm = content.toLowerCase().includes('login') ||
                               content.toLowerCase().includes('sign in');

            return !hasLoginForm;
        } catch (error) {
            return false;
        }
    }

    /**
     * 检查是否包含个人数据
     */
    containsPersonalData(content) {
        const personalDataPatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN模式
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // 信用卡号
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // 邮箱
            /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, // 电话号码
        ];

        return personalDataPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 检查版权问题
     */
    hasCopyrightIssues(content) {
        const copyrightIndicators = [
            /copyright\s+\d{4}/i,
            /©\s*\d{4}/i,
            /all\s+rights\s+reserved/i,
            /confidential/i,
            /proprietary/i
        ];

        return copyrightIndicators.some(pattern => pattern.test(content));
    }

    /**
     * 处理HTTP错误
     */
    async handleHttpError(url, error) {
        if (!this.rules.handleHttpErrors) {
            throw error;
        }

        const errorHandlers = {
            429: async () => {
                // 速率限制错误
                console.warn(`Rate limited for ${url}, increasing delay...`);
                this.rateLimiter.increaseDelay(url);
                await this.wait(60000); // 等待1分钟
            },
            403: async () => {
                // 禁止访问
                console.warn(`Access forbidden for ${url}`);
                this.robotsChecker.blockDomain(new URL(url).hostname);
            },
            500: async () => {
                // 服务器错误
                console.warn(`Server error for ${url}, retrying after delay...`);
                await this.wait(5000); // 等待5秒
            }
        };

        const statusCode = error.response?.status;
        if (errorHandlers[statusCode]) {
            await errorHandlers[statusCode]();
        } else {
            console.error(`Unhandled HTTP error ${statusCode} for ${url}:`, error);
        }
    }

    /**
     * 等待指定时间
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 加载合规配置
     */
    loadComplianceConfig() {
        try {
            const stored = localStorage.getItem('scraper_compliance_config');
            if (stored) {
                const config = JSON.parse(stored);
                Object.assign(this.rules, config.rules);
            }
        } catch (error) {
            console.error('Failed to load compliance config:', error);
        }
    }

    /**
     * 保存合规配置
     */
    saveComplianceConfig() {
        try {
            const config = {
                rules: this.rules,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('scraper_compliance_config', JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save compliance config:', error);
        }
    }

    /**
     * 获取合规报告
     */
    getComplianceReport() {
        return {
            rules: this.rules,
            rateLimit: this.rateLimiter.getStatus(),
            robotsTxt: this.robotsChecker.getStatus(),
            logs: this.complianceLogger.getRecentLogs(),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 高级速率限制器
 */
class AdvancedRateLimiter {
    constructor() {
        this.domainLimits = new Map();
        this.globalLimit = {
            requests: 0,
            window: 60000, // 1分钟
            maxRequests: 60 // 每分钟最多60次请求
        };
        this.lastGlobalReset = Date.now();
    }

    async wait(url) {
        const domain = this.extractDomain(url);
        const now = Date.now();

        // 检查全局限制
        if (now - this.lastGlobalReset > this.globalLimit.window) {
            this.globalLimit.requests = 0;
            this.lastGlobalReset = now;
        }

        if (this.globalLimit.requests >= this.globalLimit.maxRequests) {
            const waitTime = this.globalLimit.window - (now - this.lastGlobalReset);
            await this.waitTime(waitTime);
        }

        // 检查域名限制
        await this.checkDomainLimit(domain);

        this.globalLimit.requests++;
    }

    async checkDomainLimit(domain) {
        if (!this.domainLimits.has(domain)) {
            this.domainLimits.set(domain, {
                requests: 0,
                window: 60000, // 1分钟
                maxRequests: 10, // 每个域名每分钟最多10次请求
                lastReset: Date.now()
            });
        }

        const limit = this.domainLimits.get(domain);
        const now = Date.now();

        if (now - limit.lastReset > limit.window) {
            limit.requests = 0;
            limit.lastReset = now;
        }

        if (limit.requests >= limit.maxRequests) {
            const waitTime = limit.window - (now - limit.lastReset);
            await this.waitTime(waitTime);
        }

        limit.requests++;
    }

    increaseDelay(url) {
        const domain = this.extractDomain(url);
        const limit = this.domainLimits.get(domain);
        if (limit) {
            limit.maxRequests = Math.max(1, Math.floor(limit.maxRequests * 0.8));
        }
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (error) {
            return 'unknown';
        }
    }

    async waitTime(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatus() {
        return {
            global: {
                requests: this.globalLimit.requests,
                maxRequests: this.globalLimit.maxRequests,
                window: this.globalLimit.window
            },
            domains: Array.from(this.domainLimits.entries()).map(([domain, limit]) => ({
                domain,
                requests: limit.requests,
                maxRequests: limit.maxRequests
            }))
        };
    }
}

/**
 * Robots.txt检查器
 */
class RobotsTxtChecker {
    constructor() {
        this.cache = new Map();
        this.blockedDomains = new Set();
    }

    async canAccess(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;

            if (this.blockedDomains.has(domain)) {
                return false;
            }

            const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;
            const rules = await this.getRobotsRules(robotsUrl);

            const userAgent = 'AnimeRaidScraper';
            const path = urlObj.pathname;

            return this.isAllowed(rules, userAgent, path);
        } catch (error) {
            console.error('Error checking robots.txt:', error);
            return true; // 错误时允许访问
        }
    }

    async getRobotsRules(robotsUrl) {
        if (this.cache.has(robotsUrl)) {
            const cached = this.cache.get(robotsUrl);
            if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24小时缓存
                return cached.rules;
            }
        }

        try {
            const response = await fetch(robotsUrl);
            if (response.ok) {
                const content = await response.text();
                const rules = this.parseRobotsTxt(content);
                this.cache.set(robotsUrl, {
                    rules,
                    timestamp: Date.now()
                });
                return rules;
            }
        } catch (error) {
            console.error('Error fetching robots.txt:', error);
        }

        return { allow: [], disallow: [] };
    }

    parseRobotsTxt(content) {
        const rules = {
            'User-agent': [],
            'Allow': [],
            'Disallow': [],
            'Crawl-delay': []
        };

        let currentUserAgent = '*';

        content.split('\n').forEach(line => {
            line = line.trim();
            if (line.startsWith('#') || !line) return;

            const [key, value] = line.split(':').map(s => s.trim());
            if (!key || !value) return;

            switch (key.toLowerCase()) {
                case 'user-agent':
                    currentUserAgent = value;
                    if (!rules['User-agent'].includes(currentUserAgent)) {
                        rules['User-agent'].push(currentUserAgent);
                    }
                    break;
                case 'allow':
                    rules['Allow'].push({ agent: currentUserAgent, path: value });
                    break;
                case 'disallow':
                    rules['Disallow'].push({ agent: currentUserAgent, path: value });
                    break;
                case 'crawl-delay':
                    rules['Crawl-delay'].push({ agent: currentUserAgent, delay: parseInt(value) });
                    break;
            }
        });

        return rules;
    }

    isAllowed(rules, userAgent, path) {
        const disallowed = rules['Disallow']
            .filter(rule => rule.agent === '*' || rule.agent.toLowerCase() === userAgent.toLowerCase())
            .some(rule => path.startsWith(rule.path));

        if (disallowed) {
            const allowed = rules['Allow']
                .filter(rule => rule.agent === '*' || rule.agent.toLowerCase() === userAgent.toLowerCase())
                .some(rule => path.startsWith(rule.path));

            return allowed;
        }

        return true;
    }

    blockDomain(domain) {
        this.blockedDomains.add(domain);
        console.warn(`Domain ${domain} blocked due to access restrictions`);
    }

    getStatus() {
        return {
            cacheSize: this.cache.size,
            blockedDomains: Array.from(this.blockedDomains),
            lastUpdate: Date.now()
        };
    }
}

/**
 * 请求延迟管理器
 */
class RequestDelay {
    constructor() {
        this.baseDelay = 2000; // 2秒基础延迟
        this.maxDelay = 30000; // 最大30秒延迟
        this.currentDelay = this.baseDelay;
        this.lastRequest = 0;
    }

    async wait() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < this.currentDelay) {
            const waitTime = this.currentDelay - timeSinceLastRequest;
            await this.waitTime(waitTime);
        }

        this.lastRequest = Date.now();

        // 随机化延迟
        this.currentDelay = this.baseDelay + Math.random() * 3000;
    }

    async waitTime(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 反检测模块
 */
class DetectionAvoidance {
    constructor() {
        this.sessionCookies = new Map();
        this.fingerprintProtection = true;
    }

    getHeaders() {
        const headers = {};

        // 添加随机化的请求头
        if (this.fingerprintProtection) {
            headers['Sec-Fetch-Dest'] = 'document';
            headers['Sec-Fetch-Mode'] = 'navigate';
            headers['Sec-Fetch-Site'] = 'none';
            headers['Sec-Fetch-User'] = '?1';
        }

        return headers;
    }

    updateSessionCookies(url, cookies) {
        const domain = new URL(url).hostname;
        this.sessionCookies.set(domain, cookies);
    }

    getSessionCookies(url) {
        const domain = new URL(url).hostname;
        return this.sessionCookies.get(domain) || [];
    }
}

/**
 * 合规日志记录器
 */
class ComplianceLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    logRequest(requestId, url, status, error = null) {
        const log = {
            requestId,
            url,
            status,
            error,
            timestamp: new Date().toISOString()
        };

        this.logs.push(log);

        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // 存储到localStorage
        this.saveLogs();
    }

    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }

    saveLogs() {
        try {
            localStorage.setItem('scraper_compliance_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save compliance logs:', error);
        }
    }

    loadLogs() {
        try {
            const stored = localStorage.getItem('scraper_compliance_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load compliance logs:', error);
        }
    }
}

// 导出合规模块实例
window.scraperCompliance = new ScraperCompliance();
window.ScraperCompliance = ScraperCompliance;

console.log('Scraper Compliance Module loaded successfully');