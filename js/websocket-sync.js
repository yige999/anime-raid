/**
 * WebSocket Real-time Sync - 实时数据同步
 * 提供多设备同步、冲突解决、实时更新等功能
 */
class WebSocketSync {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.isConnected = false;
        this.syncCallbacks = new Set();
        this.pendingUpdates = new Map();
        this.conflictResolver = new ConflictResolver();
        this.deviceId = this.generateDeviceId();

        this.init();
    }

    /**
     * 初始化WebSocket连接
     */
    init() {
        this.connect();
        this.setupVisibilityHandler();
        console.log('WebSocket Sync initialized');
    }

    /**
     * 连接到WebSocket服务器
     */
    connect() {
        try {
            // 模拟WebSocket连接（实际使用真实WebSocket服务器）
            this.simulateWebSocketConnection();
            console.log('WebSocket connection established');
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleReconnect();
        }
    }

    /**
     * 模拟WebSocket连接（开发环境）
     */
    simulateWebSocketConnection() {
        this.isConnected = true;
        this.startHeartbeat();
        this.simulateRealtimeUpdates();

        // 模拟连接事件
        setTimeout(() => {
            this.onOpen();
        }, 100);
    }

    /**
     * WebSocket连接打开事件
     */
    onOpen() {
        console.log('WebSocket connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 发送设备信息
        this.send({
            type: 'device_info',
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        });

        // 同步本地数据
        this.syncLocalData();
    }

    /**
     * WebSocket消息接收
     */
    onMessage(data) {
        try {
            const message = typeof data === 'string' ? JSON.parse(data) : data;

            switch (message.type) {
                case 'update':
                    this.handleRemoteUpdate(message);
                    break;
                case 'sync_request':
                    this.handleSyncRequest(message);
                    break;
                case 'heartbeat':
                    this.handleHeartbeat(message);
                    break;
                case 'conflict':
                    this.handleConflict(message);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * WebSocket连接关闭事件
     */
    onClose() {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.stopHeartbeat();
        this.handleReconnect();
    }

    /**
     * WebSocket错误事件
     */
    onError(error) {
        console.error('WebSocket error:', error);
        this.isConnected = false;
    }

    /**
     * 发送消息
     */
    send(data) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, message queued:', data);
            this.queueMessage(data);
        }
    }

    /**
     * 处理远程更新
     */
    handleRemoteUpdate(message) {
        const { data, timestamp, deviceId } = message;

        // 检查是否是自己的更新
        if (deviceId === this.deviceId) {
            return;
        }

        // 检查冲突
        const localData = this.getLocalData(data.type, data.id);
        if (localData && localData.timestamp > timestamp) {
            // 有冲突，启动冲突解决
            this.conflictResolver.resolve(localData, data, (resolvedData) => {
                this.updateLocalData(resolvedData);
                this.notifySyncCallbacks('update_resolved', resolvedData);
            });
        } else {
            // 无冲突，直接更新
            this.updateLocalData(data);
            this.notifySyncCallbacks('remote_update', data);
        }
    }

    /**
     * 处理同步请求
     */
    handleSyncRequest(message) {
        const { requestId, dataType } = message;
        const localData = this.getAllLocalData(dataType);

        this.send({
            type: 'sync_response',
            requestId: requestId,
            deviceId: this.deviceId,
            data: localData
        });
    }

    /**
     * 处理心跳
     */
    handleHeartbeat(message) {
        // 回复心跳
        this.send({
            type: 'heartbeat_response',
            timestamp: Date.now()
        });
    }

    /**
     * 处理冲突
     */
    handleConflict(message) {
        const { localData, remoteData } = message;
        this.conflictResolver.resolve(localData, remoteData, (resolvedData) => {
            this.send({
                type: 'conflict_resolved',
                data: resolvedData,
                deviceId: this.deviceId
            });
        });
    }

    /**
     * 发送本地更新
     */
    sendUpdate(dataType, data) {
        const update = {
            type: 'update',
            dataType: dataType,
            data: data,
            deviceId: this.deviceId,
            timestamp: Date.now()
        };

        this.send(update);

        // 同时更新本地数据
        this.updateLocalData(data);
    }

    /**
     * 同步本地数据
     */
    syncLocalData() {
        // 获取所有本地数据类型并同步
        ['characters', 'codes', 'tierList', 'userSettings'].forEach(dataType => {
            const localData = this.getAllLocalData(dataType);
            if (localData.length > 0) {
                this.send({
                    type: 'bulk_sync',
                    dataType: dataType,
                    data: localData,
                    deviceId: this.deviceId
                });
            }
        });
    }

    /**
     * 模拟实时更新
     */
    simulateRealtimeUpdates() {
        // 模拟其他用户的更新
        setInterval(() => {
            if (this.isConnected && Math.random() < 0.1) { // 10%概率
                const mockUpdate = this.generateMockUpdate();
                this.onMessage({
                    type: 'update',
                    data: mockUpdate,
                    timestamp: Date.now(),
                    deviceId: 'other-device-' + Math.random().toString(36).substr(2, 9)
                });
            }
        }, 10000); // 每10秒检查一次
    }

    /**
     * 生成模拟更新
     */
    generateMockUpdate() {
        const updateTypes = ['character_rating', 'code_status', 'tier_change'];
        const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];

        switch (randomType) {
            case 'character_rating':
                return {
                    type: 'character_rating',
                    id: 'shadow-assassin',
                    rating: 90 + Math.floor(Math.random() * 10),
                    reason: 'Community feedback update'
                };
            case 'code_status':
                return {
                    type: 'code_status',
                    code: 'ANIMERAID2025',
                    status: Math.random() > 0.5 ? 'active' : 'expired',
                    uses: Math.floor(Math.random() * 10000)
                };
            case 'tier_change':
                return {
                    type: 'tier_change',
                    characterId: 'ice-mage',
                    oldTier: 'A',
                    newTier: Math.random() > 0.5 ? 'S' : 'A',
                    reason: 'Balance update'
                };
            default:
                return { type: 'generic_update' };
        }
    }

    /**
     * 获取本地数据
     */
    getLocalData(dataType, id) {
        const key = `${dataType}_${id}`;
        return JSON.parse(localStorage.getItem(key) || 'null');
    }

    /**
     * 获取所有本地数据
     */
    getAllLocalData(dataType) {
        const data = [];
        const prefix = `${dataType}_`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                data.push(item);
            }
        }

        return data;
    }

    /**
     * 更新本地数据
     */
    updateLocalData(data) {
        const key = `${data.type}_${data.id}`;
        const item = {
            ...data,
            lastSynced: Date.now(),
            deviceId: this.deviceId
        };

        localStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * 处理重连
     */
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.notifySyncCallbacks('connection_failed', null);
        }
    }

    /**
     * 启动心跳
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({
                    type: 'heartbeat',
                    timestamp: Date.now()
                });
            }
        }, 30000); // 30秒心跳
    }

    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * 设置页面可见性处理
     */
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected) {
                console.log('Page visible, reconnecting...');
                this.connect();
            }
        });
    }

    /**
     * 注册同步回调
     */
    onSync(callback) {
        this.syncCallbacks.add(callback);
    }

    /**
     * 移除同步回调
     */
    removeSyncCallback(callback) {
        this.syncCallbacks.delete(callback);
    }

    /**
     * 通知同步回调
     */
    notifySyncCallbacks(event, data) {
        this.syncCallbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Sync callback error:', error);
            }
        });
    }

    /**
     * 队列消息
     */
    queueMessage(message) {
        const queue = JSON.parse(localStorage.getItem('ws_message_queue') || '[]');
        queue.push(message);
        localStorage.setItem('ws_message_queue', JSON.stringify(queue));
    }

    /**
     * 生成设备ID
     */
    generateDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            deviceId: this.deviceId
        };
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.stopHeartbeat();
        this.isConnected = false;
    }
}

/**
 * 冲突解决器
 */
class ConflictResolver {
    constructor() {
        this.resolutionStrategies = {
            'character_rating': this.resolveRatingConflict,
            'code_status': this.resolveCodeConflict,
            'tier_change': this.resolveTierConflict,
            'default': this.resolveGenericConflict
        };
    }

    /**
     * 解决冲突
     */
    resolve(localData, remoteData, callback) {
        const strategy = this.resolutionStrategies[localData.type] || this.resolutionStrategies.default;
        const resolvedData = strategy.call(this, localData, remoteData);
        callback(resolvedData);
    }

    /**
     * 解决评分冲突
     */
    resolveRatingConflict(localData, remoteData) {
        // 使用平均值作为解决方案
        const avgRating = Math.round((localData.rating + remoteData.rating) / 2);
        return {
            ...localData,
            rating: avgRating,
            conflictResolved: true,
            resolutionStrategy: 'average',
            originalLocalRating: localData.rating,
            originalRemoteRating: remoteData.rating
        };
    }

    /**
     * 解决兑换码冲突
     */
    resolveCodeConflict(localData, remoteData) {
        // 使用最新的时间戳
        return remoteData.timestamp > localData.timestamp ? remoteData : localData;
    }

    /**
     * 解决层级冲突
     */
    resolveTierConflict(localData, remoteData) {
        // 使用更高的层级（更保守的策略）
        const tierOrder = { 'S': 3, 'A': 2, 'B': 1, 'C': 0 };
        const localScore = tierOrder[localData.newTier] || 0;
        const remoteScore = tierOrder[remoteData.newTier] || 0;

        return localScore > remoteScore ? localData : remoteData;
    }

    /**
     * 解决通用冲突
     */
    resolveGenericConflict(localData, remoteData) {
        // 使用最新时间戳的版本
        return remoteData.timestamp > localData.timestamp ? remoteData : localData;
    }
}

// 导出WebSocket同步实例
window.webSocketSync = new WebSocketSync();
window.ConflictResolver = ConflictResolver;

console.log('WebSocket Sync loaded successfully');