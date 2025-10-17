// SEO增强功能脚本

// 自动面包屑导航生成
function generateBreadcrumb() {
    const pathArray = window.location.pathname.split('/').filter(path => path);
    const breadcrumbContainer = document.querySelector('.breadcrumb-list');

    if (!breadcrumbContainer || pathArray.length === 0) return;

    let breadcrumbHTML = '<li class="breadcrumb-item"><a href="/">首页</a></li>';
    let currentPath = '/';

    pathArray.forEach((path, index) => {
        currentPath += path + '/';
        const isLast = index === pathArray.length - 1;
        const displayName = path.replace(/-/g, ' ').replace('.html', '');

        if (isLast) {
            breadcrumbHTML += `<li class="breadcrumb-separator">›</li>`;
            breadcrumbHTML += `<li class="breadcrumb-current">${displayName}</li>`;
        } else {
            breadcrumbHTML += `<li class="breadcrumb-separator">›</li>`;
            breadcrumbHTML += `<li class="breadcrumb-item"><a href="${currentPath}">${displayName}</a></li>`;
        }
    });

    breadcrumbContainer.innerHTML = breadcrumbHTML;
}

// 自动生成内容表格
function generateContentTable() {
    const headings = document.querySelectorAll('h2, h3, h4');
    const contentTableContainer = document.querySelector('.content-table ul');

    if (!contentTableContainer || headings.length === 0) return;

    let tableHTML = '';

    headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        heading.id = id;

        const indent = heading.tagName.substring(1) - 2;
        const marginLeft = indent * 16;

        tableHTML += `
            <li style="margin-left: ${marginLeft}px;">
                <a href="#${id}">${heading.textContent}</a>
            </li>
        `;
    });

    contentTableContainer.innerHTML = tableHTML;
}

// FAQ结构化数据生成
function generateFAQSchema() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;

    const faqData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": []
    };

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            faqData.mainEntity.push({
                "@type": "Question",
                "name": question.textContent.trim(),
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": answer.textContent.trim()
                }
            });
        }
    });

    // 创建或更新FAQ schema
    let schemaScript = document.querySelector('#faq-schema');
    if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.id = 'faq-schema';
        document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(faqData, null, 2);
}

// 图片懒加载优化
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy-placeholder');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    images.forEach(img => {
        img.classList.add('lazy-placeholder');
        imageObserver.observe(img);
    });
}

// 搜索关键词高亮
function highlightSearchTerms() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');

    if (!searchTerm) return;

    const contentElements = document.querySelectorAll('main p, main li, main h1, main h2, main h3');
    const regex = new RegExp(`(${searchTerm})`, 'gi');

    contentElements.forEach(element => {
        const originalHTML = element.innerHTML;
        const highlightedHTML = originalHTML.replace(regex, '<span class="search-highlight">$1</span>');
        element.innerHTML = highlightedHTML;
    });
}

// 页面性能监控
function trackPagePerformance() {
    // 监控Core Web Vitals
    if ('PerformanceObserver' in window) {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    console.log('CLS:', clsValue);
                }
            });
        });

        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            fidObserver.observe({ entryTypes: ['first-input'] });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.log('Performance observers not supported');
        }
    }
}

// 相关内容推荐
function generateRelatedContent() {
    const currentTitle = document.title.toLowerCase();
    const currentKeywords = extractKeywords(currentTitle);

    // 这里应该从API或数据库获取相关内容
    // 现在使用示例数据
    const relatedContent = [
        {
            title: 'Anime Raid 最新代码',
            url: '/codes/',
            icon: '🎁',
            keywords: ['codes', 'redeem', 'gift']
        },
        {
            title: '角色排行攻略',
            url: '/tier-lists/',
            icon: '🏆',
            keywords: ['tier', 'ranking', 'characters']
        },
        {
            title: '新手入门指南',
            url: '/guides/beginner-guide.html',
            icon: '📖',
            keywords: ['beginner', 'guide', 'tutorial']
        }
    ];

    const relatedContainer = document.querySelector('.related-links');
    if (!relatedContainer) return;

    const filteredContent = relatedContent.filter(content => {
        return currentKeywords.some(keyword =>
            content.keywords.some(contentKeyword =>
                contentKeyword.includes(keyword) || keyword.includes(contentKeyword)
            )
        );
    });

    let relatedHTML = '';
    filteredContent.slice(0, 3).forEach(content => {
        relatedHTML += `
            <a href="${content.url}" class="related-link">
                <span class="related-link-icon">${content.icon}</span>
                <span>${content.title}</span>
            </a>
        `;
    });

    relatedContainer.innerHTML = relatedHTML;
}

// 从标题中提取关键词
function extractKeywords(title) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'guide', 'wiki'];
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
}

// 页面离开时的数据统计
function setupPageAnalytics() {
    let timeOnPage = 0;
    const startTime = Date.now();

    // 定期更新页面停留时间
    setInterval(() => {
        timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);

    // 页面离开时发送数据
    window.addEventListener('beforeunload', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view_duration', {
                page_title: document.title,
                page_location: window.location.href,
                duration_seconds: timeOnPage
            });
        }
    });

    // 滚动深度跟踪
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        maxScroll = Math.max(maxScroll, scrollPercent);
    });

    window.addEventListener('beforeunload', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll_depth', {
                page_title: document.title,
                max_scroll_percent: maxScroll
            });
        }
    });
}

// 初始化所有SEO增强功能
document.addEventListener('DOMContentLoaded', function() {
    generateBreadcrumb();
    generateContentTable();
    generateFAQSchema();
    setupLazyLoading();
    highlightSearchTerms();
    trackPagePerformance();
    generateRelatedContent();
    setupPageAnalytics();
});

// 处理页面导航更新 (SPA支持)
window.addEventListener('popstate', function() {
    setTimeout(() => {
        generateBreadcrumb();
        generateContentTable();
        highlightSearchTerms();
    }, 100);
});