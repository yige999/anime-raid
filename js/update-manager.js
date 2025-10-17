/**
 * Update Manager - Smart Update Manager
 * Handles data updates, cache management, background sync, etc.
 */
class UpdateManager {
    constructor() {
        this.apiService = window.apiService;
        this.updateInterval = 60000; // Check once per minute
        this.userActivityScore = 0;
        this.lastActivityTime = Date.now();
        this.backgroundUpdateEnabled = true;
        this.updateCallbacks = new Set();

        this.init();
    }

    /**
     * Initialize update manager
     */
    init() {
        this.startUpdateScheduler();
        this.setupActivityTracking();
        this.setupServiceWorker();
        console.log('Update Manager initialized');
    }

    /**
     * Start update scheduler
     */
    startUpdateScheduler() {
        // Adjust check frequency based on user activity
        setInterval(() => {
            this.scheduleUpdate();
        }, this.getUpdateInterval());
    }

    /**
     * Smart update scheduling
     */
    async scheduleUpdate() {
        // If user is inactive, reduce update frequency
        if (!this.isUserActive()) {
            return;
        }

        try {
            const updateResult = await this.checkForUpdates();
            if (updateResult.success && updateResult.data.hasUpdates) {
                await this.processUpdates(updateResult.data.updates);
                this.notifyUpdateCallbacks(updateResult.data);
            }
        } catch (error) {
            console.error('Scheduled update failed:', error);
        }
    }

    /**
     * Check for updates
     */
    async checkForUpdates() {
        return await this.apiService.checkForUpdates();
    }

    /**
     * 处理更新
     */
    async processUpdates(updates) {
        for (const update of updates) {
            switch (update.type) {
                case 'character':
                    await this.updateCharacterData();
                    break;
                case 'code':
                    await this.updateCodeData();
                    break;
                case 'tier_list':
                    await this.updateTierListData();
                    break;
                case 'content':
                    await this.updateContentData();
                    break;
            }
        }
    }

    /**
     * 更新角色数据
     */
    async updateCharacterData() {
        const response = await this.apiService.getCharacters();
        if (response.success) {
            // 清除缓存并重新获取
            this.apiService.clearCache();
            console.log('Character data updated');

            // 更新UI
            this.updateCharacterUI(response.data.characters);
        }
    }

    /**
     * 更新兑换码数据
     */
    async updateCodeData() {
        const response = await this.apiService.getCodes();
        if (response.success) {
            console.log('Code data updated');
            this.updateCodeUI(response.data);
        }
    }

    /**
     * 更新排行榜数据
     */
    async updateTierListData() {
        const response = await this.apiService.getTierList();
        if (response.success) {
            console.log('Tier list data updated');
            this.updateTierListUI(response.data);
        }
    }

    /**
     * 更新内容数据
     */
    async updateContentData() {
        console.log('Content data updated');
        // 可以在这里处理页面内容更新
    }

    /**
     * 设置活动跟踪
     */
    setupActivityTracking() {
        // 跟踪用户活动
        ['click', 'scroll', 'keydown', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.recordUserActivity();
            }, { passive: true });
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.recordUserActivity();
                // 页面重新可见时立即检查更新
                this.scheduleUpdate();
            }
        });
    }

    /**
     * 记录用户活动
     */
    recordUserActivity() {
        this.lastActivityTime = Date.now();
        this.userActivityScore = Math.min(100, this.userActivityScore + 5);
    }

    /**
     * 检查用户是否活跃
     */
    isUserActive() {
        const inactiveTime = Date.now() - this.lastActivityTime;
        const isActive = inactiveTime < 300000; // 5分钟内活跃
        return isActive;
    }

    /**
     * 获取智能更新间隔
     */
    getUpdateInterval() {
        // 根据用户活跃度调整检查频率
        if (!this.isUserActive()) {
            return this.updateInterval * 4; // 不活跃时4倍间隔
        }

        if (this.userActivityScore > 80) {
            return this.updateInterval * 0.5; // 高活跃度时更频繁
        }

        return this.updateInterval;
    }

    /**
     * 设置Service Worker
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);

                // 监听消息
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'UPDATE_AVAILABLE') {
                        this.handleBackgroundUpdate(event.data.payload);
                    }
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * 处理后台更新
     */
    async handleBackgroundUpdate(payload) {
        console.log('Background update received:', payload);
        await this.processUpdates(payload.updates);
        this.showUpdateNotification(payload);
    }

    /**
     * 显示更新通知
     */
    showUpdateNotification(payload) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Anime Raid - New Content Available', {
                body: payload.description || 'New updates are available!',
                icon: '/assets/icons/favicon.svg',
                badge: '/assets/icons/favicon-32.png',
                tag: 'anime-raid-update'
            });
        }
    }

    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    /**
     * 注册更新回调
     */
    onUpdate(callback) {
        this.updateCallbacks.add(callback);
    }

    /**
     * 移除更新回调
     */
    removeUpdateCallback(callback) {
        this.updateCallbacks.delete(callback);
    }

    /**
     * 通知所有更新回调
     */
    notifyUpdateCallbacks(updateData) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback(updateData);
            } catch (error) {
                console.error('Update callback error:', error);
            }
        });
    }

    /**
     * 更新角色UI
     */
    updateCharacterUI(characters) {
        // 更新角色页面数据显示
        characters.forEach(character => {
            const characterElements = document.querySelectorAll(`[data-character-id="${character.id}"]`);
            characterElements.forEach(element => {
                // 更新角色数据
                if (element.dataset.updateRating) {
                    const ratingElement = element.querySelector('.rating');
                    if (ratingElement) {
                        ratingElement.textContent = `${character.rating}/100`;
                    }
                }
            });
        });
    }

    /**
     * 更新兑换码UI
     */
    updateCodeUI(codeData) {
        // 更新兑换码列表
        const activeCodesContainer = document.getElementById('active-codes');
        if (activeCodesContainer && codeData.active) {
            // 可以在这里动态更新兑换码显示
            console.log('Updated active codes:', codeData.active.length);
        }
    }

    /**
     * 更新排行榜UI
     */
    updateTierListUI(tierData) {
        // 更新排行榜显示
        console.log('Updated tier list:', tierData);
    }

    /**
     * 强制立即更新
     */
    async forceUpdate() {
        this.recordUserActivity();
        await this.scheduleUpdate();
    }

    /**
     * 清除所有数据
     */
    clearAllData() {
        this.apiService.clearCache();
        localStorage.clear();
        console.log('All data cleared');
    }
}

// 导出更新管理器实例
window.updateManager = new UpdateManager();

// 添加到全局作用域以便调试
window.UpdateManager = UpdateManager;