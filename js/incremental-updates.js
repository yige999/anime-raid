/**
 * Incremental Updates - 增量更新机制
 * 只更新变化的数据部分，减少数据传输量
 */
class IncrementalUpdateManager {
    constructor() {
        this.dataVersions = new Map();
        this.changeLog = new Map();
        this.differentialCache = new Map();
        this.compressionEnabled = true;

        this.init();
    }

    /**
     * 初始化增量更新系统
     */
    init() {
        this.loadStoredVersions();
        this.setupUpdateHandlers();
        console.log('Incremental Update Manager initialized');
    }

    /**
     * 设置更新处理器
     */
    setupUpdateHandlers() {
        // 监听更新管理器的事件
        if (window.updateManager) {
            window.updateManager.onUpdate((updateData) => {
                this.processIncrementalUpdate(updateData);
            });
        }

        // 监听WebSocket同步事件
        if (window.webSocketSync) {
            window.webSocketSync.onSync((event, data) => {
                if (event === 'remote_update') {
                    this.applyIncrementalChange(data);
                }
            });
        }
    }

    /**
     * 处理增量更新
     */
    async processIncrementalUpdate(updateData) {
        const dataType = updateData.type;
        const currentVersion = this.dataVersions.get(dataType) || 0;
        const serverVersion = updateData.version || currentVersion + 1;

        if (serverVersion <= currentVersion) {
            console.log(`Data ${dataType} is already up to date`);
            return;
        }

        try {
            // 计算差异
            const diff = await this.calculateDifference(dataType, currentVersion, serverVersion);

            if (diff && diff.changes.length > 0) {
                // 应用增量更新
                await this.applyIncrementalChanges(dataType, diff);

                // 更新版本号
                this.dataVersions.set(dataType, serverVersion);
                this.saveVersions();

                console.log(`Applied ${diff.changes.length} incremental updates for ${dataType}`);
            } else {
                // 没有变化，直接更新版本号
                this.dataVersions.set(dataType, serverVersion);
                this.saveVersions();
            }
        } catch (error) {
            console.error('Failed to process incremental update:', error);
            // 回退到完整更新
            this.requestFullUpdate(dataType);
        }
    }

    /**
     * 计算数据差异
     */
    async calculateDifference(dataType, fromVersion, toVersion) {
        const localData = this.getLocalData(dataType);
        const remoteData = await this.getRemoteData(dataType);

        if (!remoteData) {
            return null;
        }

        const changes = [];

        switch (dataType) {
            case 'characters':
                changes.push(...this.calculateCharacterDifferences(localData, remoteData));
                break;
            case 'codes':
                changes.push(...this.calculateCodeDifferences(localData, remoteData));
                break;
            case 'tier_list':
                changes.push(...this.calculateTierListDifferences(localData, remoteData));
                break;
            default:
                changes.push(...this.calculateGenericDifferences(localData, remoteData));
        }

        return {
            fromVersion: fromVersion,
            toVersion: toVersion,
            changes: changes,
            timestamp: Date.now()
        };
    }

    /**
     * 计算角色数据差异
     */
    calculateCharacterDifferences(localData, remoteData) {
        const changes = [];
        const localCharacters = localData || [];

        remoteData.forEach(remoteChar => {
            const localChar = localCharacters.find(c => c.id === remoteChar.id);

            if (!localChar) {
                // 新增角色
                changes.push({
                    type: 'add',
                    dataType: 'character',
                    data: remoteChar
                });
            } else {
                // 检查变化
                const charDiff = this.findCharacterDifferences(localChar, remoteChar);
                if (charDiff.length > 0) {
                    changes.push({
                        type: 'update',
                        dataType: 'character',
                        id: remoteChar.id,
                        changes: charDiff
                    });
                }
            }
        });

        // 检查删除的角色
        localData.forEach(localChar => {
            const existsInRemote = remoteData.find(c => c.id === localChar.id);
            if (!existsInRemote) {
                changes.push({
                    type: 'delete',
                    dataType: 'character',
                    id: localChar.id
                });
            }
        });

        return changes;
    }

    /**
     * 查找角色差异
     */
    findCharacterDifferences(localChar, remoteChar) {
        const differences = [];
        const fieldsToCompare = ['name', 'tier', 'rating', 'stats', 'description'];

        fieldsToCompare.forEach(field => {
            if (JSON.stringify(localChar[field]) !== JSON.stringify(remoteChar[field])) {
                differences.push({
                    field: field,
                    oldValue: localChar[field],
                    newValue: remoteChar[field]
                });
            }
        });

        return differences;
    }

    /**
     * 计算兑换码差异
     */
    calculateCodeDifferences(localData, remoteData) {
        const changes = [];
        const localCodes = localData?.active || [];

        // 检查新的和更新的兑换码
        remoteData.active.forEach(remoteCode => {
            const localCode = localCodes.find(c => c.code === remoteCode.code);

            if (!localCode) {
                // 新增兑换码
                changes.push({
                    type: 'add',
                    dataType: 'code',
                    data: remoteCode
                });
            } else if (localCode.status !== remoteCode.status || localCode.uses !== remoteCode.uses) {
                // 更新兑换码状态
                changes.push({
                    type: 'update',
                    dataType: 'code',
                    code: remoteCode.code,
                    changes: {
                        status: { old: localCode.status, new: remoteCode.status },
                        uses: { old: localCode.uses, new: remoteCode.uses }
                    }
                });
            }
        });

        // 检查过期的兑换码
        localCodes.forEach(localCode => {
            const isActiveInRemote = remoteData.active.find(c => c.code === localCode.code);
            const isExpiredInRemote = remoteData.expired?.find(c => c.code === localCode.code);

            if (isActiveInRemote && localCode.status === 'expired') {
                // 重新激活的兑换码
                changes.push({
                    type: 'reactivate',
                    dataType: 'code',
                    code: localCode.code
                });
            } else if (!isActiveInRemote && !isExpiredInRemote && localCode.status === 'active') {
                // 新过期的兑换码
                changes.push({
                    type: 'expire',
                    dataType: 'code',
                    code: localCode.code
                });
            }
        });

        return changes;
    }

    /**
     * 计算排行榜差异
     */
    calculateTierListDifferences(localData, remoteData) {
        const changes = [];

        // 简单比较每个层级的角色
        ['S', 'A', 'B', 'C'].forEach(tier => {
            const localTier = localData?.[tier] || [];
            const remoteTier = remoteData[tier] || [];

            // 检查新增和移动的角色
            remoteTier.forEach(remoteChar => {
                const localChar = localTier.find(c => c.id === remoteChar.id);
                if (!localChar) {
                    // 查找角色是否在其他层级
                    const oldTier = this.findCharacterTier(localData, remoteChar.id);
                    changes.push({
                        type: 'tier_change',
                        dataType: 'tier_list',
                        characterId: remoteChar.id,
                        oldTier: oldTier,
                        newTier: tier,
                        rating: remoteChar.rating
                    });
                }
            });
        });

        return changes;
    }

    /**
     * 查找角色所在层级
     */
    findCharacterTier(tierData, characterId) {
        if (!tierData) return null;

        for (const [tier, characters] of Object.entries(tierData)) {
            if (characters.find(c => c.id === characterId)) {
                return tier;
            }
        }
        return null;
    }

    /**
     * 计算通用差异
     */
    calculateGenericDifferences(localData, remoteData) {
        const changes = [];

        if (JSON.stringify(localData) !== JSON.stringify(remoteData)) {
            changes.push({
                type: 'full_update',
                dataType: 'generic',
                data: remoteData
            });
        }

        return changes;
    }

    /**
     * 应用增量变更
     */
    async applyIncrementalChanges(dataType, diff) {
        const localData = this.getLocalData(dataType) || [];

        diff.changes.forEach(change => {
            switch (change.type) {
                case 'add':
                    this.addDataItem(localData, change);
                    break;
                case 'update':
                    this.updateDataItem(localData, change);
                    break;
                case 'delete':
                    this.deleteDataItem(localData, change);
                    break;
                case 'tier_change':
                    this.updateTierChange(localData, change);
                    break;
                case 'expire':
                case 'reactivate':
                    this.updateCodeStatus(localData, change);
                    break;
            }
        });

        // 保存更新后的数据
        this.saveLocalData(dataType, localData);

        // 通知UI更新
        this.notifyUIUpdate(dataType, diff.changes);
    }

    /**
     * 添加数据项
     */
    addDataItem(localData, change) {
        if (change.dataType === 'character') {
            localData.push(change.data);
        } else if (change.dataType === 'code') {
            if (!localData.active) localData.active = [];
            localData.active.push(change.data);
        }
    }

    /**
     * 更新数据项
     */
    updateDataItem(localData, change) {
        if (change.dataType === 'character') {
            const index = localData.findIndex(item => item.id === change.id);
            if (index !== -1) {
                change.changes.forEach(fieldChange => {
                    localData[index][fieldChange.field] = fieldChange.newValue;
                });
            }
        } else if (change.dataType === 'code') {
            const activeCodes = localData.active || [];
            const index = activeCodes.findIndex(item => item.code === change.code);
            if (index !== -1) {
                Object.keys(change.changes).forEach(field => {
                    activeCodes[index][field] = change.changes[field].new;
                });
            }
        }
    }

    /**
     * 删除数据项
     */
    deleteDataItem(localData, change) {
        if (change.dataType === 'character') {
            const index = localData.findIndex(item => item.id === change.id);
            if (index !== -1) {
                localData.splice(index, 1);
            }
        }
    }

    /**
     * 更新层级变化
     */
    updateTierChange(localData, change) {
        // 从旧层级移除
        if (change.oldTier && localData[change.oldTier]) {
            const oldTierIndex = localData[change.oldTier].findIndex(c => c.id === change.characterId);
            if (oldTierIndex !== -1) {
                localData[change.oldTier].splice(oldTierIndex, 1);
            }
        }

        // 添加到新层级
        if (!localData[change.newTier]) {
            localData[change.newTier] = [];
        }
        localData[change.newTier].push({
            id: change.characterId,
            rating: change.rating
        });
    }

    /**
     * 更新兑换码状态
     */
    updateCodeStatus(localData, change) {
        const activeCodes = localData.active || [];
        const expiredCodes = localData.expired || [];

        const codeIndex = activeCodes.findIndex(c => c.code === change.code);
        if (codeIndex !== -1) {
            const code = activeCodes.splice(codeIndex, 1)[0];
            code.status = change.type === 'expire' ? 'expired' : 'active';

            if (change.type === 'expire') {
                expiredCodes.push(code);
            }
        } else if (change.type === 'reactivate') {
            const expiredIndex = expiredCodes.findIndex(c => c.code === change.code);
            if (expiredIndex !== -1) {
                const code = expiredCodes.splice(expiredIndex, 1)[0];
                code.status = 'active';
                activeCodes.push(code);
            }
        }
    }

    /**
     * 获取本地数据
     */
    getLocalData(dataType) {
        const key = `${dataType}_data`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * 保存本地数据
     */
    saveLocalData(dataType, data) {
        const key = `${dataType}_data`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * 获取远程数据
     */
    async getRemoteData(dataType) {
        if (window.apiService) {
            try {
                switch (dataType) {
                    case 'characters':
                        const charResponse = await window.apiService.getCharacters();
                        return charResponse.success ? charResponse.data.characters : null;
                    case 'codes':
                        const codeResponse = await window.apiService.getCodes();
                        return codeResponse.success ? codeResponse.data : null;
                    case 'tier_list':
                        const tierResponse = await window.apiService.getTierList();
                        return tierResponse.success ? tierResponse.data.characters : null;
                    default:
                        return null;
                }
            } catch (error) {
                console.error('Failed to get remote data:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * 请求完整更新
     */
    async requestFullUpdate(dataType) {
        console.log(`Requesting full update for ${dataType}`);
        const remoteData = await this.getRemoteData(dataType);
        if (remoteData) {
            this.saveLocalData(dataType, remoteData);
            this.notifyUIUpdate(dataType, [{ type: 'full_update', data: remoteData }]);
        }
    }

    /**
     * 通知UI更新
     */
    notifyUIUpdate(dataType, changes) {
        const event = new CustomEvent('incrementalUpdate', {
            detail: { dataType, changes }
        });
        document.dispatchEvent(event);
    }

    /**
     * 加载存储的版本信息
     */
    loadStoredVersions() {
        try {
            const stored = localStorage.getItem('data_versions');
            if (stored) {
                const versions = JSON.parse(stored);
                this.dataVersions = new Map(Object.entries(versions));
            }
        } catch (error) {
            console.error('Failed to load data versions:', error);
        }
    }

    /**
     * 保存版本信息
     */
    saveVersions() {
        try {
            const versions = Object.fromEntries(this.dataVersions);
            localStorage.setItem('data_versions', JSON.stringify(versions));
        } catch (error) {
            console.error('Failed to save data versions:', error);
        }
    }

    /**
     * 强制完整同步
     */
    async forceFullSync() {
        const dataTypes = ['characters', 'codes', 'tier_list'];
        for (const dataType of dataTypes) {
            await this.requestFullUpdate(dataType);
        }
    }

    /**
     * 获取更新统计
     */
    getUpdateStats() {
        return {
            versions: Object.fromEntries(this.dataVersions),
            lastUpdate: localStorage.getItem('last_incremental_update'),
            totalUpdates: parseInt(localStorage.getItem('total_incremental_updates') || '0')
        };
    }
}

// 导出增量更新管理器实例
window.incrementalUpdateManager = new IncrementalUpdateManager();

console.log('Incremental Update Manager loaded successfully');