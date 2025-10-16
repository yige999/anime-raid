// Anime Raid Wiki - Main JavaScript

// ===== 全局变量 =====
let mobileMenuOpen = false;
let currentFilter = 'all';
let codesData = [];
let charactersData = [];

// ===== DOM 加载完成后执行 =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeSearch();
    initializeFilters();
    initializeTooltips();
    initializeScrollEffects();
    initializeAnalytics();
    loadContentData();
});

// ===== 移动端菜单 =====
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // 点击外部关闭菜单
    document.addEventListener('click', function(e) {
        if (mobileMenuOpen && !e.target.closest('#mobile-menu-btn') && !e.target.closest('#mobile-menu')) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuOpen = !mobileMenuOpen;

    if (mobileMenuOpen) {
        mobileMenu.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.add('hidden');
    document.body.style.overflow = '';
    mobileMenuOpen = false;
}

// ===== 搜索功能 =====
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length > 2) {
                searchTimeout = setTimeout(() => performSearch(query), 300);
            } else {
                hideSearchResults();
            }
        });

        // 点击外部关闭搜索结果
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-box')) {
                hideSearchResults();
            }
        });
    }
}

function performSearch(query) {
    const results = searchContent(query);
    displaySearchResults(results, query);
}

function searchContent(query) {
    const results = [];
    const lowercaseQuery = query.toLowerCase();

    // 搜索角色
    charactersData.forEach(character => {
        if (character.name.toLowerCase().includes(lowercaseQuery) ||
            character.description.toLowerCase().includes(lowercaseQuery)) {
            results.push({
                type: 'character',
                title: character.name,
                description: character.description,
                url: `/database/units/${character.id}.html`,
                element: character.element
            });
        }
    });

    // 搜索兑换码
    codesData.forEach(code => {
        if (code.code.toLowerCase().includes(lowercaseQuery)) {
            results.push({
                type: 'code',
                title: code.code,
                description: code.reward,
                url: '/codes/',
                status: code.status
            });
        }
    });

    return results.slice(0, 8); // 限制显示数量
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');

    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                未找到与 "${query}" 相关的内容
            </div>
        `;
    } else {
        const resultsHtml = results.map(result => `
            <a href="${result.url}" class="block p-3 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-semibold text-gray-900">${result.title}</div>
                        <div class="text-sm text-gray-600">${result.description}</div>
                    </div>
                    ${getElementIcon(result.element || result.type)}
                </div>
            </a>
        `).join('');

        searchResults.innerHTML = resultsHtml;
    }

    searchResults.classList.remove('hidden');
}

function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.classList.add('hidden');
}

function getElementIcon(element) {
    const icons = {
        fire: '<span class="text-red-500">🔥</span>',
        water: '<span class="text-blue-500">💧</span>',
        nature: '<span class="text-green-500">🌿</span>',
        thunder: '<span class="text-yellow-500">⚡</span>',
        dark: '<span class="text-purple-500">🌙</span>',
        light: '<span class="text-yellow-300">✨</span>',
        wind: '<span class="text-cyan-500">🌪️</span>',
        earth: '<span class="text-brown-500">🪨</span>',
        code: '<span class="text-green-500">🎁</span>'
    };
    return icons[element] || '';
}

// ===== 筛选功能 =====
function initializeFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter || this.textContent.trim();
            setActiveFilter(filter);
            filterContent(filter);
        });
    });
}

function setActiveFilter(filter) {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-red-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });

    // 激活当前筛选按钮
    const activeBtn = Array.from(filterBtns).find(btn =>
        btn.dataset.filter === filter || btn.textContent.trim() === filter
    );

    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        activeBtn.classList.add('active', 'bg-red-600', 'text-white');
    }

    currentFilter = filter;
}

function filterContent(filter) {
    // 这里可以根据不同页面实现不同的筛选逻辑
    if (document.querySelector('.character-cards')) {
        filterCharacters(filter);
    } else if (document.querySelector('.code-list')) {
        filterCodes(filter);
    }
}

function filterCharacters(filter) {
    const characterCards = document.querySelectorAll('.character-card');

    characterCards.forEach(card => {
        const characterType = card.dataset.type || 'all';

        if (filter === 'all' || characterType === filter) {
            card.style.display = '';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function filterCodes(filter) {
    const codeItems = document.querySelectorAll('.code-badge');

    codeItems.forEach(item => {
        const codeStatus = item.dataset.status || 'active';

        if (filter === 'all' || codeStatus === filter) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ===== 工具提示 =====
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = e.target.dataset.tooltip;
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip-popup';
    tooltipEl.textContent = tooltip;

    document.body.appendChild(tooltipEl);

    const rect = e.target.getBoundingClientRect();
    tooltipEl.style.left = rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + 'px';
    tooltipEl.style.top = rect.top - tooltipEl.offsetHeight - 8 + 'px';

    setTimeout(() => {
        tooltipEl.style.opacity = '1';
    }, 10);
}

function hideTooltip() {
    const tooltipEl = document.querySelector('.tooltip-popup');
    if (tooltipEl) {
        tooltipEl.style.opacity = '0';
        setTimeout(() => {
            tooltipEl.remove();
        }, 200);
    }
}

// ===== 滚动效果 =====
function initializeScrollEffects() {
    const navbar = document.querySelector('nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;

        // 导航栏阴影效果
        if (currentScrollY > 10) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }

        // 统计元素动画
        animateCounters();

        lastScrollY = currentScrollY;
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.counter');

    counters.forEach(counter => {
        const rect = counter.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible && !counter.classList.contains('animated')) {
            const target = parseInt(counter.dataset.target);
            const duration = 2000; // 2秒
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            counter.classList.add('animated');

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };

            updateCounter();
        }
    });
}

// ===== 数据加载 =====
function loadContentData() {
    // 模拟加载兑换码数据
    codesData = [
        {
            code: 'ANIMERAID2025',
            reward: '钻石 x5000',
            status: 'active',
            expiry: '2025-12-31'
        },
        {
            code: 'SUMMERGIFT500',
            reward: '金币 x100,000',
            status: 'active',
            expiry: '2025-10-31'
        },
        {
            code: 'RAIDNEWYEAR',
            reward: '神秘宝箱 x5',
            status: 'expiring',
            expiry: '2025-10-20'
        }
    ];

    // 模拟加载角色数据
    charactersData = [
        {
            id: 'flame-warrior',
            name: '烈焰战士',
            element: 'fire',
            type: 'attacker',
            description: '高伤害火属性攻击者',
            rating: 'S'
        },
        {
            id: 'ice-mage',
            name: '寒冰法师',
            element: 'water',
            type: 'controller',
            description: '强力控制与团队增益',
            rating: 'S'
        },
        {
            id: 'holy-priest',
            name: '神圣牧师',
            element: 'light',
            type: 'healer',
            description: '最强治疗与复活能力',
            rating: 'S'
        }
    ];
}

// ===== 兑换码功能 =====
function copyCode(codeElement) {
    const code = codeElement.dataset.code || codeElement.textContent;

    navigator.clipboard.writeText(code).then(() => {
        showToast('兑换码已复制到剪贴板！', 'success');

        // 视觉反馈
        const originalText = codeElement.textContent;
        codeElement.textContent = '已复制!';
        codeElement.classList.add('bg-green-100');

        setTimeout(() => {
            codeElement.textContent = originalText;
            codeElement.classList.remove('bg-green-100');
        }, 2000);
    }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
    });
}

// ===== Toast 通知 =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };

    toast.classList.add(colors[type] || colors.info);
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ===== 分析统计 =====
function initializeAnalytics() {
    // 页面访问统计
    trackPageView();

    // 用户交互追踪
    trackUserInteractions();

    // 性能监控
    trackPagePerformance();
}

function trackPageView() {
    // 这里可以集成 Google Analytics 或其他分析工具
    const pageData = {
        url: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent
    };

    // 发送到分析服务器
    console.log('Page view tracked:', pageData);
}

function trackUserInteractions() {
    // 追踪按钮点击
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a, button');
        if (target) {
            trackInteraction('click', target.textContent.trim(), target.href);
        }
    });

    // 追踪搜索
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('search', function(e) {
            const query = e.target.value.trim();
            if (query.length > 2) {
                trackInteraction('search', query);
            }
        });
    }
}

function trackInteraction(action, label, value = null) {
    const interactionData = {
        action,
        label,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.pathname
    };

    console.log('Interaction tracked:', interactionData);
}

function trackPagePerformance() {
    window.addEventListener('load', function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;

        if (loadTime > 0) {
            console.log('Page load time:', loadTime + 'ms');

            // 如果加载时间过长，显示提示
            if (loadTime > 3000) {
                showToast('页面加载较慢，请检查网络连接', 'warning');
            }
        }
    });
}

// ===== 实用工具函数 =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`;
    if (diffDays < 0) return `已过期${Math.abs(diffDays)}天`;

    return date.toLocaleDateString('zh-CN');
}

// ===== 错误处理 =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // 可以发送错误报告到服务器
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// ===== 导出函数供全局使用 =====
window.AnimeRaidWiki = {
    copyCode,
    showToast,
    performSearch,
    filterContent,
    toggleMobileMenu
};