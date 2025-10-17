/**
 * API Service - 模拟后端API接口
 * 提供数据获取、更新检查、版本控制等功能
 */
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.cache = new Map();
        this.version = '1.0.0';
        this.lastUpdate = new Date().toISOString();
    }

    /**
     * 检查更新
     */
    async checkForUpdates() {
        try {
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 500));

            const response = {
                success: true,
                data: {
                    hasUpdates: this.simulateUpdateCheck(),
                    version: this.version,
                    lastUpdate: this.lastUpdate,
                    updates: this.generateMockUpdates()
                }
            };

            return response;
        } catch (error) {
            console.error('Update check failed:', error);
            return {
                success: false,
                error: error.message,
                data: { hasUpdates: false }
            };
        }
    }

    /**
     * 获取角色数据
     */
    async getCharacters() {
        try {
            const cached = this.cache.get('characters');
            if (cached && !this.isCacheExpired(cached.timestamp)) {
                return cached.data;
            }

            const response = {
                success: true,
                data: {
                    characters: this.generateMockCharacters(),
                    metadata: {
                        total: 4,
                        version: this.version,
                        lastUpdated: this.lastUpdate
                    }
                }
            };

            this.cache.set('characters', {
                data: response,
                timestamp: Date.now()
            });

            return response;
        } catch (error) {
            console.error('Failed to fetch characters:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取兑换码数据
     */
    async getCodes() {
        try {
            // 尝试从JSON文件获取真实数据
            const jsonResponse = await fetch('/data/codes.json');
            if (jsonResponse.ok) {
                const jsonData = await jsonResponse.json();
                return {
                    success: true,
                    data: {
                        active: jsonData.codes.active,
                        expired: jsonData.codes.expired,
                        metadata: {
                            totalActive: jsonData.codes.active.length,
                            totalExpired: jsonData.codes.expired.length,
                            lastUpdated: jsonData.lastUpdate,
                            version: jsonData.version
                        }
                    }
                };
            }

            // 回退到模拟数据
            console.log('Using mock data - JSON file not available');
            const response = {
                success: true,
                data: {
                    active: this.generateMockActiveCodes(),
                    expired: this.generateMockExpiredCodes(),
                    metadata: {
                        totalActive: 15,
                        totalExpired: 8,
                        lastUpdated: new Date().toISOString()
                    }
                }
            };
            return response;
        } catch (error) {
            console.error('Failed to fetch codes:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取排行榜数据
     */
    async getTierList() {
        try {
            const response = {
                success: true,
                data: {
                    characters: this.generateMockTierData(),
                    lastUpdated: new Date().toISOString(),
                    version: this.version
                }
            };
            return response;
        } catch (error) {
            console.error('Failed to fetch tier list:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 提交用户数据
     */
    async submitUserData(data) {
        try {
            // 模拟数据提交
            await new Promise(resolve => setTimeout(resolve, 300));

            console.log('User data submitted:', data);
            return {
                success: true,
                message: 'Data submitted successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Data submission failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 模拟更新检查
     */
    simulateUpdateCheck() {
        // 20%概率有更新
        return Math.random() < 0.2;
    }

    /**
     * 生成模拟更新数据
     */
    generateMockUpdates() {
        const updateTypes = ['character', 'code', 'tier_list', 'content'];
        const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];

        return [{
            id: this.generateId(),
            type: randomType,
            title: `New ${randomType.replace('_', ' ')} content available`,
            description: 'Updated data with new information and features',
            timestamp: new Date().toISOString(),
            priority: Math.random() > 0.7 ? 'high' : 'normal'
        }];
    }

    /**
     * 生成模拟角色数据
     */
    generateMockCharacters() {
        return [
            {
                id: 'shadow-assassin',
                name: 'Shadow Assassin',
                tier: 'S',
                role: 'DPS',
                element: 'Dark',
                rating: 92,
                stats: { atk: 95, def: 65, spd: 90, hp: 70 },
                description: 'High burst damage assassin with stealth capabilities',
                lastUpdated: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'holy-priest',
                name: 'Holy Priest',
                tier: 'S',
                role: 'Healer',
                element: 'Light',
                rating: 89,
                stats: { atk: 45, def: 72, spd: 68, hp: 85 },
                description: 'Powerful healer with team protection abilities',
                lastUpdated: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 'flame-warrior',
                name: 'Flame Warrior',
                tier: 'A',
                role: 'DPS',
                element: 'Fire',
                rating: 87,
                stats: { atk: 89, def: 78, spd: 62, hp: 82 },
                description: 'Balanced fighter with fire abilities',
                lastUpdated: new Date(Date.now() - 259200000).toISOString()
            },
            {
                id: 'ice-mage',
                name: 'Ice Mage',
                tier: 'A',
                role: 'Control',
                element: 'Water',
                rating: 84,
                stats: { atk: 82, def: 58, spd: 71, hp: 65 },
                description: 'Crowd control specialist with ice magic',
                lastUpdated: new Date(Date.now() - 345600000).toISOString()
            }
        ];
    }

    /**
     * 生成模拟有效兑换码
     */
    generateMockActiveCodes() {
        return [
            { code: 'RAID2024', reward: '500 Gems', expires: '2024-12-31', uses: 15234 },
            { code: 'ANIMEHERO', reward: '1000 Gems + 10 Summon Tickets', expires: '2024-12-25', uses: 8921 },
            { code: 'WINTER2024', reward: 'Winter Gift Box', expires: '2025-01-15', uses: 6543 },
            { code: 'NEWBONUS', reward: 'Stamina Potion x5', expires: '2024-12-20', uses: 3421 },
            { code: 'GUILDWAR', reward: 'Guild War Chest', expires: '2024-12-28', uses: 2876 }
        ];
    }

    /**
     * 生成模拟过期兑换码
     */
    generateMockExpiredCodes() {
        return [
            { code: 'LAUNCH2024', reward: 'Launch Gems', expired: '2024-11-30', totalUses: 45321 },
            { code: 'OCTOBER2024', reward: 'Halloween Special', expired: '2024-11-01', totalUses: 28934 }
        ];
    }

    /**
     * 生成模拟排行榜数据
     */
    generateMockTierData() {
        return {
            S: [
                { id: 'shadow-assassin', name: 'Shadow Assassin', rating: 92, role: 'DPS' },
                { id: 'holy-priest', name: 'Holy Priest', rating: 89, role: 'Healer' }
            ],
            A: [
                { id: 'flame-warrior', name: 'Flame Warrior', rating: 87, role: 'DPS' },
                { id: 'ice-mage', name: 'Ice Mage', rating: 84, role: 'Control' }
            ],
            B: [],
            C: []
        };
    }

    /**
     * 检查缓存是否过期
     */
    isCacheExpired(timestamp, ttl = 300000) { // 5分钟默认TTL
        return Date.now() - timestamp > ttl;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

// 导出API服务实例
window.apiService = new ApiService();
console.log('API Service loaded successfully');