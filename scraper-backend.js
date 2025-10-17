/**
 * Scraper Backend - 后端代理服务
 * 用于处理跨域请求、增强抓取能力、提供API接口
 *
 * 运行方式：
 * 1. 安装依赖：npm install express cors axios cheerio puppeteer
 * 2. 运行服务：node scraper-backend.js
 * 3. 前端访问：http://localhost:3001/api/*
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 请求缓存
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

// 速率限制
const rateLimits = new Map();

/**
 * 速率限制中间件
 */
function rateLimit(req, res, next) {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟窗口
    const maxRequests = 30; // 每分钟最多30次请求

    if (!rateLimits.has(clientIp)) {
        rateLimits.set(clientIp, { count: 0, resetTime: now + windowMs });
    }

    const clientLimit = rateLimits.get(clientIp);

    if (now > clientLimit.resetTime) {
        clientLimit.count = 0;
        clientLimit.resetTime = now + windowMs;
    }

    if (clientLimit.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    clientLimit.count++;
    next();
}

/**
 * 缓存中间件
 */
function cacheMiddleware(req, res, next) {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
    }

    next();
}

/**
 * 设置响应缓存
 */
function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });

    // 清理过期缓存
    if (cache.size > 1000) {
        for (const [cacheKey, value] of cache.entries()) {
            if (Date.now() - value.timestamp > CACHE_TTL) {
                cache.delete(cacheKey);
            }
        }
    }
}

// Twitter抓取端点
app.get('/api/twitter/search', rateLimit, cacheMiddleware, async (req, res) => {
    try {
        const { q, count = 20 } = req.query;

        // 使用Nitter实例（Twitter的开源前端）
        const nitterUrl = `https://nitter.net/search?q=${encodeURIComponent(q)}&f=tweets&count=${count}`;

        const response = await axios.get(nitterUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
            },
            timeout: 10000
        });

        const tweets = parseTweetsFromHTML(response.data);

        setCache(req.originalUrl, { success: true, tweets });
        res.json({ success: true, tweets });

    } catch (error) {
        console.error('Twitter search error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            tweets: []
        });
    }
});

// Reddit抓取端点
app.get('/api/reddit/search', rateLimit, cacheMiddleware, async (req, res) => {
    try {
        const { subreddit, q, limit = 25 } = req.query;

        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(q)}&sort=new&limit=${limit}&type=link`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AnimeRaidScraper/1.0)'
            },
            timeout: 10000
        });

        const posts = response.data.data.children.map(child => ({
            id: child.data.id,
            title: child.data.title,
            url: child.data.url,
            author: child.data.author,
            subreddit: child.data.subreddit,
            created_utc: child.data.created_utc,
            selftext: child.data.selftext,
            permalink: `https://reddit.com${child.data.permalink}`
        }));

        setCache(req.originalUrl, { success: true, posts });
        res.json({ success: true, posts });

    } catch (error) {
        console.error('Reddit search error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            posts: []
        });
    }
});

// 通用网页抓取端点
app.post('/api/scrape', rateLimit, async (req, res) => {
    try {
        const { url, selector, usePuppeteer = false } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        let content;

        if (usePuppeteer) {
            // 使用Puppeteer处理JavaScript渲染的页面
            content = await scrapeWithPuppeteer(url, selector);
        } else {
            // 使用简单的HTTP请求
            content = await scrapeWithAxios(url, selector);
        }

        // 提取兑换码
        const codes = extractCodesFromContent(content, url);

        setCache(req.originalUrl, { success: true, content, codes, url });
        res.json({
            success: true,
            content: content.substring(0, 1000), // 限制返回内容长度
            codes,
            url
        });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Discord Webhook监听端点
app.post('/api/discord/webhook', express.raw({type: 'application/json'}), (req, res) => {
    try {
        const discordData = JSON.parse(req.body);

        // 处理Discord消息
        if (discordData.content) {
            const codes = extractCodesFromText(discordData.content);

            if (codes.length > 0) {
                // 通知前端有新的Discord消息
                notifyDiscordUpdate({
                    author: discordData.author?.username || 'Unknown',
                    content: discordData.content,
                    channel: discordData.channel_id,
                    codes,
                    timestamp: new Date().toISOString()
                });
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Discord webhook error:', error);
        res.status(500).send('Error');
    }
});

// 获取抓取统计
app.get('/api/stats', (req, res) => {
    const stats = {
        cacheSize: cache.size,
        rateLimitedClients: rateLimits.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    };

    res.json(stats);
});

// 清理缓存
app.post('/api/cache/clear', (req, res) => {
    cache.clear();
    res.json({ success: true, message: 'Cache cleared' });
});

/**
 * 使用Puppeteer抓取网页
 */
async function scrapeWithPuppeteer(url, selector) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        if (selector) {
            return await page.$eval(selector, el => el.textContent || el.innerHTML);
        } else {
            return await page.content();
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * 使用Axios抓取网页
 */
async function scrapeWithAxios(url, selector) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000
    });

    if (selector) {
        const $ = cheerio.load(response.data);
        return $(selector).text() || $(selector).html();
    } else {
        return response.data;
    }
}

/**
 * 从HTML解析推文
 */
function parseTweetsFromHTML(html) {
    const $ = cheerio.load(html);
    const tweets = [];

    $('.timeline-item').each((i, element) => {
        const $tweet = $(element);

        const tweet = {
            id: $tweet.find('.tweet-id').text() || `tweet_${i}`,
            content: $tweet.find('.tweet-content').text().trim(),
            author: $tweet.find('.username').text().trim(),
            timestamp: $tweet.find('.tweet-date a').attr('title') || new Date().toISOString(),
            url: $tweet.find('.tweet-date a').attr('href') || '',
            likes: parseInt($tweet.find('.tweet-stats span').first().text()) || 0,
            retweets: parseInt($tweet.find('.tweet-stats span').eq(1).text()) || 0
        };

        if (tweet.content && tweet.author) {
            tweets.push(tweet);
        }
    });

    return tweets;
}

/**
 * 从内容中提取兑换码
 */
function extractCodesFromContent(content, source) {
    const codes = [];
    const $ = cheerio.load(content);

    // 获取页面文本
    const text = $('body').text();

    // 兑换码正则模式
    const codePatterns = [
        /\b([A-Z0-9]{8,20})\b/g,
        /\b(GIFT|CODE|PROMO)[-_]?([A-Z0-9]{6,16})\b/gi,
        /\b([A-Z]{3,}[-_]?[0-9]{3,})\b/g,
        /['""]([A-Z0-9]{8,20})['""]/g,
    ];

    codePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const code = match[1] || match[0];

            if (isValidCode(code)) {
                codes.push({
                    code: code,
                    source: source,
                    foundAt: new Date().toISOString(),
                    context: extractCodeContext(text, code)
                });
            }
        }
    });

    return codes;
}

/**
 * 从文本中提取兑换码
 */
function extractCodesFromText(text) {
    const codes = [];
    const codePatterns = [
        /\b([A-Z0-9]{8,20})\b/g,
        /\b(GIFT|CODE|PROMO)[-_]?([A-Z0-9]{6,16})\b/gi,
    ];

    codePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const code = match[1] || match[0];
            if (isValidCode(code)) {
                codes.push({
                    code: code,
                    foundAt: new Date().toISOString()
                });
            }
        }
    });

    return codes;
}

/**
 * 验证兑换码有效性
 */
function isValidCode(code) {
    if (code.length < 6 || code.length > 25) return false;

    const excludeWords = ['AND', 'THE', 'FOR', 'WITH', 'HAVE', 'THIS', 'THAT', 'FROM', 'THEY'];
    if (excludeWords.includes(code)) return false;

    const hasNumber = /\d/.test(code);
    const hasLetter = /[A-Z]/.test(code);

    return hasNumber || hasLetter;
}

/**
 * 提取兑换码上下文
 */
function extractCodeContext(text, code) {
    const index = text.indexOf(code);
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + code.length + 50);

    return text.substring(start, end).trim();
}

/**
 * 通知Discord更新
 */
function notifyDiscordUpdate(data) {
    // 这里可以通过WebSocket或其他方式通知前端
    console.log('Discord update received:', data);
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`Scraper backend server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('Shutting down scraper backend...');
    process.exit(0);
});

module.exports = app;