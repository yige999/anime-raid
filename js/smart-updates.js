/**
 * Smart Updates - 智能更新策略
 * 根据用户活跃度、设备性能、网络状况等智能调整更新策略
 */
class SmartUpdateStrategy {
    constructor() {
        this.userBehaviorAnalyzer = new UserBehaviorAnalyzer();
        this.networkMonitor = new NetworkMonitor();
        this.performanceMonitor = new PerformanceMonitor();
        this.cacheManager = new SmartCacheManager();

        this.updateStrategies = {
            aggressive: this.createAggressiveStrategy(),
            normal: this.createNormalStrategy(),
            conservative: this.createConservativeStrategy(),
            minimal: this.createMinimalStrategy()
        };

        this.currentStrategy = 'normal';
        this.strategyUpdateInterval = 60000; // 1分钟评估一次策略

        this.init();
    }

    /**
     * 初始化智能更新系统
     */
    init() {
        this.startStrategyEvaluation();
        this.setupEventListeners();
        console.log('Smart Update Strategy initialized');
    }

    /**
     * 启动策略评估
     */
    startStrategyEvaluation() {
        setInterval(() => {
            this.evaluateAndUpdateStrategy();
        }, this.strategyUpdateInterval);
    }

    /**
     * 评估并更新策略
     */
    evaluateAndUpdateStrategy() {
        const userProfile = this.userBehaviorAnalyzer.getUserProfile();
        const networkStatus = this.networkMonitor.getStatus();
        const performanceStatus = this.performanceMonitor.getStatus();

        const newStrategy = this.determineOptimalStrategy(userProfile, networkStatus, performanceStatus);

        if (newStrategy !== this.currentStrategy) {
            console.log(`Strategy changed from ${this.currentStrategy} to ${newStrategy}`);
            this.currentStrategy = newStrategy;
            this.applyStrategy(newStrategy);
        }
    }

    /**
     * 确定最优策略
     */
    determineOptimalStrategy(userProfile, networkStatus, performanceStatus) {
        // 检查网络状况
        if (networkStatus.type === 'slow-2g' || networkStatus.saveData) {
            return 'minimal';
        }

        if (networkStatus.type === '2g' || networkStatus.effectiveType === '2g') {
            return 'conservative';
        }

        // 检查设备性能
        if (performanceStatus.lowMemory || performanceStatus.lowEndDevice) {
            return 'conservative';
        }

        // 检查用户活跃度
        if (userProfile.activityScore > 80 && userProfile.engagementTime > 300) {
            // 高活跃度用户
            if (networkStatus.type === '4g' && !performanceStatus.lowEndDevice) {
                return 'aggressive';
            }
            return 'normal';
        }

        if (userProfile.activityScore < 20) {
            // 不活跃用户
            return 'minimal';
        }

        // 检查电量状态
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2 && !battery.charging) {
                    return 'minimal';
                }
            });
        }

        // 默认策略
        return 'normal';
    }

    /**
     * 应用策略
     */
    applyStrategy(strategyName) {
        const strategy = this.updateStrategies[strategyName];
        if (!strategy) return;

        // 更新更新管理器的配置
        if (window.updateManager) {
            window.updateManager.updateInterval = strategy.checkInterval;
            window.updateManager.backgroundUpdateEnabled = strategy.backgroundUpdate;
        }

        // 更新缓存管理器
        this.cacheManager.updateStrategy(strategy);

        // 通知其他组件策略变更
        this.notifyStrategyChange(strategyName, strategy);
    }

    /**
     * 创建激进策略
     */
    createAggressiveStrategy() {
        return {
            name: 'aggressive',
            checkInterval: 30000, // 30秒
            backgroundUpdate: true,
            preloadContent: true,
            aggressiveCaching: false,
            priorityUpdates: ['character', 'code', 'tier_list'],
            batchUpdates: false,
            compressionEnabled: false,
            imageOptimization: 'high'
        };
    }

    /**
     * 创建普通策略
     */
    createNormalStrategy() {
        return {
            name: 'normal',
            checkInterval: 60000, // 1分钟
            backgroundUpdate: true,
            preloadContent: true,
            aggressiveCaching: true,
            priorityUpdates: ['code', 'character'],
            batchUpdates: true,
            compressionEnabled: true,
            imageOptimization: 'medium'
        };
    }

    /**
     * 创建保守策略
     */
    createConservativeStrategy() {
        return {
            name: 'conservative',
            checkInterval: 180000, // 3分钟
            backgroundUpdate: false,
            preloadContent: false,
            aggressiveCaching: true,
            priorityUpdates: ['code'],
            batchUpdates: true,
            compressionEnabled: true,
            imageOptimization: 'low'
        };
    }

    /**
     * 创建最小策略
     */
    createMinimalStrategy() {
        return {
            name: 'minimal',
            checkInterval: 600000, // 10分钟
            backgroundUpdate: false,
            preloadContent: false,
            aggressiveCaching: true,
            priorityUpdates: [],
            batchUpdates: true,
            compressionEnabled: true,
            imageOptimization: 'minimal'
        };
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 网络状态变化
        this.networkMonitor.onNetworkChange((status) => {
            this.evaluateAndUpdateStrategy();
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.evaluateAndUpdateStrategy();
            }
        });

        // 电量状态变化
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    this.evaluateAndUpdateStrategy();
                });
                battery.addEventListener('chargingchange', () => {
                    this.evaluateAndUpdateStrategy();
                });
            });
        }
    }

    /**
     * 通知策略变更
     */
    notifyStrategyChange(strategyName, strategy) {
        const event = new CustomEvent('strategyChange', {
            detail: { strategyName, strategy }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前策略
     */
    getCurrentStrategy() {
        return {
            name: this.currentStrategy,
            config: this.updateStrategies[this.currentStrategy],
            userProfile: this.userBehaviorAnalyzer.getUserProfile(),
            networkStatus: this.networkMonitor.getStatus(),
            performanceStatus: this.performanceMonitor.getStatus()
        };
    }

    /**
     * 强制刷新策略
     */
    forceRefresh() {
        this.evaluateAndUpdateStrategy();
    }
}

/**
 * 用户行为分析器
 */
class UserBehaviorAnalyzer {
    constructor() {
        this.sessions = [];
        this.currentSession = null;
        this.activityHistory = [];
        this.clickCount = 0;
        this.scrollDepth = 0;
        this.dwellTime = 0;

        this.init();
    }

    init() {
        this.startSession();
        this.trackUserActivity();
        this.loadStoredData();
    }

    /**
     * 开始新会话
     */
    startSession() {
        this.currentSession = {
            startTime: Date.now(),
            endTime: null,
            pageViews: 1,
            interactions: 0,
            scrollEvents: 0,
            clicks: 0
        };

        // 页面卸载时结束会话
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    /**
     * 结束会话
     */
    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
            this.sessions.push(this.currentSession);
            this.saveData();
        }
    }

    /**
     * 跟踪用户活动
     */
    trackUserActivity() {
        // 点击跟踪
        document.addEventListener('click', () => {
            if (this.currentSession) {
                this.currentSession.clicks++;
                this.currentSession.interactions++;
            }
            this.clickCount++;
            this.recordActivity('click');
        });

        // 滚动跟踪
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (Math.abs(currentScrollY - lastScrollY) > 100) {
                if (this.currentSession) {
                    this.currentSession.scrollEvents++;
                }
                this.recordActivity('scroll');
                lastScrollY = currentScrollY;

                // 计算滚动深度
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const currentDepth = (currentScrollY / maxScroll) * 100;
                this.scrollDepth = Math.max(this.scrollDepth, currentDepth);
            }
        }, { passive: true });

        // 键盘输入跟踪
        document.addEventListener('keydown', () => {
            if (this.currentSession) {
                this.currentSession.interactions++;
            }
            this.recordActivity('keyboard');
        });

        // 鼠标移动跟踪（低频率）
        let mouseMoveTimeout;
        document.addEventListener('mousemove', () => {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                this.recordActivity('mouse');
            }, 1000);
        });
    }

    /**
     * 记录活动
     */
    recordActivity(type) {
        const activity = {
            type: type,
            timestamp: Date.now()
        };
        this.activityHistory.push(activity);

        // 保持最近100个活动记录
        if (this.activityHistory.length > 100) {
            this.activityHistory = this.activityHistory.slice(-100);
        }
    }

    /**
     * 获取用户画像
     */
    getUserProfile() {
        const now = Date.now();
        const recentActivity = this.activityHistory.filter(a => now - a.timestamp < 300000); // 5分钟内

        // 计算活跃度分数
        const activityScore = Math.min(100, recentActivity.length * 2);

        // 计算参与时间
        const engagementTime = this.calculateEngagementTime();

        // 计算访问频率
        const visitFrequency = this.calculateVisitFrequency();

        return {
            activityScore: activityScore,
            engagementTime: engagementTime,
            visitFrequency: visitFrequency,
            scrollDepth: this.scrollDepth,
            clickCount: this.clickCount,
            sessionCount: this.sessions.length,
            averageSessionDuration: this.calculateAverageSessionDuration(),
            userTier: this.determineUserTier(activityScore, engagementTime, visitFrequency)
        };
    }

    /**
     * 计算参与时间
     */
    calculateEngagementTime() {
        if (!this.currentSession) return 0;
        return Date.now() - this.currentSession.startTime;
    }

    /**
     * 计算访问频率
     */
    calculateVisitFrequency() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentSessions = this.sessions.filter(s => s.startTime > thirtyDaysAgo);
        return recentSessions.length;
    }

    /**
     * 计算平均会话时长
     */
    calculateAverageSessionDuration() {
        if (this.sessions.length === 0) return 0;
        const totalDuration = this.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        return Math.round(totalDuration / this.sessions.length);
    }

    /**
     * 确定用户层级
     */
    determineUserTier(activityScore, engagementTime, visitFrequency) {
        if (activityScore > 80 && engagementTime > 600 && visitFrequency > 20) {
            return 'power';
        } else if (activityScore > 50 && engagementTime > 300 && visitFrequency > 10) {
            return 'regular';
        } else if (activityScore > 20 && visitFrequency > 3) {
            return 'casual';
        } else {
            return 'new';
        }
    }

    /**
     * 加载存储数据
     */
    loadStoredData() {
        try {
            const stored = localStorage.getItem('user_behavior_data');
            if (stored) {
                const data = JSON.parse(stored);
                this.sessions = data.sessions || [];
                this.activityHistory = data.activityHistory || [];
                this.clickCount = data.clickCount || 0;
                this.scrollDepth = data.scrollDepth || 0;
            }
        } catch (error) {
            console.error('Failed to load user behavior data:', error);
        }
    }

    /**
     * 保存数据
     */
    saveData() {
        try {
            const data = {
                sessions: this.sessions.slice(-50), // 保留最近50个会话
                activityHistory: this.activityHistory,
                clickCount: this.clickCount,
                scrollDepth: this.scrollDepth,
                lastSaved: Date.now()
            };
            localStorage.setItem('user_behavior_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save user behavior data:', error);
        }
    }
}

/**
 * 网络监控器
 */
class NetworkMonitor {
    constructor() {
        this.callbacks = [];
        this.currentStatus = this.getCurrentNetworkStatus();
        this.init();
    }

    init() {
        this.setupNetworkListeners();
    }

    /**
     * 获取当前网络状态
     */
    getCurrentNetworkStatus() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                type: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData || false
            };
        }
        return { type: 'unknown', effectiveType: 'unknown' };
    }

    /**
     * 设置网络监听器
     */
    setupNetworkListeners() {
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                const newStatus = this.getCurrentNetworkStatus();
                if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
                    this.currentStatus = newStatus;
                    this.notifyNetworkChange(newStatus);
                }
            });
        }

        // 在线/离线状态变化
        window.addEventListener('online', () => {
            this.notifyNetworkChange({ ...this.currentStatus, online: true });
        });

        window.addEventListener('offline', () => {
            this.notifyNetworkChange({ ...this.currentStatus, online: false });
        });
    }

    /**
     * 通知网络变化
     */
    notifyNetworkChange(status) {
        this.callbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Network callback error:', error);
            }
        });
    }

    /**
     * 注册网络变化回调
     */
    onNetworkChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * 获取网络状态
     */
    getStatus() {
        return { ...this.currentStatus, online: navigator.onLine };
    }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
    constructor() {
        this.status = this.analyzePerformance();
    }

    /**
     * 分析设备性能
     */
    analyzePerformance() {
        const memory = 'deviceMemory' in navigator ? navigator.deviceMemory : 4;
        const cores = 'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : 4;

        // 检测低端设备
        const lowMemory = memory <= 2;
        const lowEndDevice = memory <= 4 && cores <= 4;

        return {
            memory: memory,
            cores: cores,
            lowMemory: lowMemory,
            lowEndDevice: lowEndDevice,
            performanceScore: this.calculatePerformanceScore(memory, cores)
        };
    }

    /**
     * 计算性能分数
     */
    calculatePerformanceScore(memory, cores) {
        const memoryScore = Math.min(100, (memory / 8) * 100);
        const cpuScore = Math.min(100, (cores / 8) * 100);
        return Math.round((memoryScore + cpuScore) / 2);
    }

    /**
     * 获取状态
     */
    getStatus() {
        return this.status;
    }
}

/**
 * 智能缓存管理器
 */
class SmartCacheManager {
    constructor() {
        this.cacheStrategies = new Map();
        this.init();
    }

    init() {
        this.setupDefaultStrategies();
    }

    /**
     * 设置默认缓存策略
     */
    setupDefaultStrategies() {
        this.cacheStrategies.set('aggressive', {
            maxSize: 100 * 1024 * 1024, // 100MB
            ttl: 300000, // 5分钟
            compressionThreshold: 1024, // 1KB以上压缩
            preloadEnabled: true
        });

        this.cacheStrategies.set('normal', {
            maxSize: 50 * 1024 * 1024, // 50MB
            ttl: 600000, // 10分钟
            compressionThreshold: 512, // 512B以上压缩
            preloadEnabled: true
        });

        this.cacheStrategies.set('conservative', {
            maxSize: 20 * 1024 * 1024, // 20MB
            ttl: 1800000, // 30分钟
            compressionThreshold: 256, // 256B以上压缩
            preloadEnabled: false
        });

        this.cacheStrategies.set('minimal', {
            maxSize: 10 * 1024 * 1024, // 10MB
            ttl: 3600000, // 1小时
            compressionThreshold: 128, // 128B以上压缩
            preloadEnabled: false
        });
    }

    /**
     * 更新策略
     */
    updateStrategy(strategy) {
        // 实现缓存策略更新逻辑
        console.log('Cache strategy updated:', strategy.name);
    }
}

// 导出智能更新策略实例
window.smartUpdateStrategy = new SmartUpdateStrategy();
window.UserBehaviorAnalyzer = UserBehaviorAnalyzer;
window.NetworkMonitor = NetworkMonitor;
window.PerformanceMonitor = PerformanceMonitor;

console.log('Smart Update Strategy loaded successfully');