// Build Calculator 高级分享系统
// 提供完整的Build分享、保存和社区功能

class BuildShareSystem {
    constructor() {
        this.builds = this.loadBuilds();
        this.userBuilds = this.loadUserBuilds();
        this.buildLikes = this.loadBuildLikes();
        this.currentBuild = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBuildFromUrl();
        this.renderPopularBuilds();
    }

    // Build存储和管理
    loadBuilds() {
        const saved = localStorage.getItem('animeRaidBuilds');
        if (saved) {
            return JSON.parse(saved);
        }

        // 默认示例Builds
        return {
            community: [
                {
                    id: 'shadow-assassin-crit',
                    name: '暗影刺客暴击流',
                    character: 'shadow-assassin',
                    level: 100,
                    weapon: 'dagger-dark',
                    armor: 'leather-legendary',
                    accessory: 'ring-crit',
                    skills: { attack: 20, defense: 3, support: 2 },
                    stats: { atk: 15800, def: 6800, hp: 42000, crit: 85 },
                    rating: 95,
                    author: 'ProGamer123',
                    likes: 247,
                    description: '极限暴击输出流，一击必杀的暗影刺客Build',
                    tags: ['暴击', 'PvP', '输出'],
                    createdAt: new Date('2025-10-15').toISOString()
                },
                {
                    id: 'holy-priest-healer',
                    name: '神圣牧师治疗流',
                    character: 'holy-priest',
                    level: 100,
                    weapon: 'staff-light',
                    armor: 'robe-legendary',
                    accessory: 'necklet-healing',
                    skills: { attack: 2, defense: 8, support: 15 },
                    stats: { atk: 4800, def: 8500, hp: 68000, healing: 95 },
                    rating: 92,
                    author: 'HealMaster',
                    likes: 189,
                    description: '极限治疗量Build，团队生存的坚实后盾',
                    tags: ['治疗', '团队', '辅助'],
                    createdAt: new Date('2025-10-14').toISOString()
                },
                {
                    id: 'fire-warrior-balanced',
                    name: '火战士均衡流',
                    character: 'fire-warrior',
                    level: 90,
                    weapon: 'sword-fire',
                    armor: 'plate-epic',
                    accessory: 'ring-power',
                    skills: { attack: 12, defense: 8, support: 5 },
                    stats: { atk: 12500, def: 10200, hp: 55000, balance: 88 },
                    rating: 87,
                    author: 'BalancedPlayer',
                    likes: 156,
                    description: '攻防兼备的均衡Build，适合各种战斗场景',
                    tags: ['均衡', '新手', '通用'],
                    createdAt: new Date('2025-10-13').toISOString()
                }
            ]
        };
    }

    saveBuilds() {
        localStorage.setItem('animeRaidBuilds', JSON.stringify(this.builds));
    }

    loadUserBuilds() {
        const saved = localStorage.getItem('animeRaidUserBuilds');
        return saved ? JSON.parse(saved) : [];
    }

    saveUserBuilds() {
        localStorage.setItem('animeRaidUserBuilds', JSON.stringify(this.userBuilds));
    }

    loadBuildLikes() {
        const saved = localStorage.getItem('animeRaidBuildLikes');
        return saved ? JSON.parse(saved) : [];
    }

    saveBuildLikes() {
        localStorage.setItem('animeRaidBuildLikes', JSON.stringify(this.buildLikes));
    }

    // Build分享功能
    generateShareLink(buildData) {
        const buildString = btoa(JSON.stringify(buildData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?build=${buildString}`;
        return shareUrl;
    }

    async shareBuild(buildData, options = {}) {
        const shareUrl = this.generateShareLink(buildData);

        try {
            if (navigator.share && !options.forceCopy) {
                // 使用原生分享API
                await navigator.share({
                    title: `${buildData.name || 'My Build'} - Anime Raid`,
                    text: buildData.description || 'Check out my awesome build!',
                    url: shareUrl
                });
            } else {
                // 复制到剪贴板
                await navigator.clipboard.writeText(shareUrl);
                this.showNotification('Build链接已复制到剪贴板！', 'success');
            }
        } catch (error) {
            console.error('Share failed:', error);
            this.showNotification('分享失败，请手动复制链接', 'error');
        }

        return shareUrl;
    }

    // 保存Build到社区
    saveBuildToCommunity(buildData) {
        const newBuild = {
            id: `user-${Date.now()}`,
            name: buildData.name || 'Untitled Build',
            character: buildData.character,
            level: buildData.level,
            weapon: buildData.weapon,
            armor: buildData.armor,
            accessory: buildData.accessory,
            skills: buildData.skills,
            stats: this.calculateStats(buildData),
            rating: this.calculateRating(buildData),
            author: 'CurrentUser',
            likes: 0,
            description: buildData.description || '',
            tags: buildData.tags || [],
            createdAt: new Date().toISOString()
        };

        this.userBuilds.push(newBuild);
        this.saveUserBuilds();

        // 同时添加到社区Builds
        this.builds.community.unshift(newBuild);
        this.saveBuilds();

        this.showNotification('Build已保存到社区！', 'success');
        return newBuild;
    }

    // 计算Build属性
    calculateStats(buildData) {
        // 简化的属性计算逻辑
        const baseStats = {
            attack: 5000,
            defense: 3000,
            hp: 20000
        };

        const characterMultipliers = {
            'shadow-assassin': { attack: 2.5, defense: 0.8, hp: 1.2 },
            'holy-priest': { attack: 0.6, defense: 1.2, hp: 1.8 },
            'fire-warrior': { attack: 1.8, defense: 1.3, hp: 1.4 }
        };

        const weaponBonuses = {
            'dagger-dark': { attack: 3000, crit: 25 },
            'staff-light': { healing: 2000, defense: 1000 },
            'sword-fire': { attack: 2500, defense: 500 }
        };

        const char = characterMultipliers[buildData.character] || { attack: 1, defense: 1, hp: 1 };
        const weapon = weaponBonuses[buildData.weapon] || {};

        const levelMultiplier = 1 + (buildData.level - 1) * 0.02;
        const skillMultiplier = 1 + (buildData.skills.attack * 0.05);

        const finalStats = {
            atk: Math.round(baseStats.attack * char.attack * levelMultiplier * skillMultiplier + (weapon.attack || 0)),
            def: Math.round(baseStats.defense * char.defense * levelMultiplier + (weapon.defense || 0)),
            hp: Math.round(baseStats.hp * char.hp * levelMultiplier),
            crit: weapon.crit || 0,
            healing: weapon.healing || 0
        };

        return finalStats;
    }

    calculateRating(buildData) {
        const stats = this.calculateStats(buildData);
        let rating = 0;

        // 基础评分
        rating += (stats.atk / 100) * 0.4;
        rating += (stats.def / 100) * 0.3;
        rating += (stats.hp / 1000) * 0.2;

        // 技能评分
        rating += (buildData.skills.attack * 2) + (buildData.skills.defense * 1.5) + (buildData.skills.support * 1);

        // 装备评分
        if (buildData.weapon) rating += 10;
        if (buildData.armor) rating += 8;
        if (buildData.accessory) rating += 5;

        return Math.min(100, Math.round(rating));
    }

    // 渲染社区Builds
    renderPopularBuilds() {
        const container = document.getElementById('community-builds');
        if (!container) return;

        const popularBuilds = this.builds.community
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 6);

        container.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">🔥 热门Build</h3>
            <div class="grid md:grid-cols-2 gap-4">
                ${popularBuilds.map(build => this.renderBuildCard(build)).join('')}
            </div>
        `;

        this.attachBuildCardEvents();
    }

    renderBuildCard(build) {
        return `
            <div class="build-card bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
                 data-build-id="${build.id}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-semibold text-gray-900">${build.name}</h4>
                        <p class="text-sm text-gray-600">by ${build.author}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-yellow-500">${build.rating}</div>
                        <div class="text-xs text-gray-500">评分</div>
                    </div>
                </div>

                <div class="text-sm text-gray-700 mb-3">${build.description}</div>

                <div class="flex flex-wrap gap-1 mb-3">
                    ${build.tags.map(tag => `
                        <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">${tag}</span>
                    `).join('')}
                </div>

                <div class="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                        <div class="text-sm font-bold text-red-600">${(build.stats.atk || 0).toLocaleString()}</div>
                        <div class="text-xs text-gray-600">攻击</div>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-blue-600">${(build.stats.def || 0).toLocaleString()}</div>
                        <div class="text-xs text-gray-600">防御</div>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-green-600">${(build.stats.hp || 0).toLocaleString()}</div>
                        <div class="text-xs text-gray-600">生命</div>
                    </div>
                </div>

                <div class="flex justify-between items-center">
                    <button class="like-build-btn text-gray-500 hover:text-red-600 transition-colors text-sm"
                            data-build-id="${build.id}">
                        ❤️ <span class="like-count">${build.likes}</span>
                    </button>
                    <button class="load-build-btn bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            data-build='${JSON.stringify(build)}'>
                        加载Build
                    </button>
                </div>
            </div>
        `;
    }

    attachBuildCardEvents() {
        // 点赞按钮
        document.querySelectorAll('.like-build-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const buildId = e.target.dataset.buildId;
                this.likeBuild(buildId);
            });
        });

        // 加载Build按钮
        document.querySelectorAll('.load-build-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const buildData = JSON.parse(e.target.dataset.build);
                this.loadBuild(buildData);
            });
        });
    }

    // 加载Build
    loadBuild(buildData) {
        // 填充表单
        document.getElementById('character-select').value = buildData.character || '';
        document.getElementById('level-slider').value = buildData.level || 80;
        document.getElementById('level-value').textContent = buildData.level || 80;
        document.getElementById('weapon-select').value = buildData.weapon || '';
        document.getElementById('armor-select').value = buildData.armor || '';
        document.getElementById('accessory-select').value = buildData.accessory || '';

        if (buildData.skills) {
            document.getElementById('attack-skills').value = buildData.skills.attack || 0;
            document.getElementById('defense-skills').value = buildData.skills.defense || 0;
            document.getElementById('support-skills').value = buildData.skills.support || 0;
        }

        // 更新当前Build数据
        this.currentBuild = buildData;

        // 重新计算结果
        if (typeof calculateBuild === 'function') {
            calculateBuild();
        }

        // 滚动到计算器
        document.querySelector('.sticky.top-24').scrollIntoView({ behavior: 'smooth' });

        this.showNotification('Build加载成功！', 'success');
    }

    // 点赞Build
    likeBuild(buildId) {
        const communityBuild = this.builds.community.find(b => b.id === buildId);
        const userBuild = this.userBuilds.find(b => b.id === buildId);
        const build = communityBuild || userBuild;

        if (build) {
            const existingLike = this.buildLikes.find(like => like.buildId === buildId);
            if (existingLike) {
                // 取消点赞
                build.likes--;
                this.buildLikes = this.buildLikes.filter(like => like.buildId !== buildId);
            } else {
                // 添加点赞
                build.likes++;
                this.buildLikes.push({ buildId, timestamp: new Date().toISOString() });
            }

            this.saveBuilds();
            this.saveUserBuilds();
            this.saveBuildLikes();
            this.renderPopularBuilds();
        }
    }

    // 从URL加载Build
    loadBuildFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const buildData = urlParams.get('build');

        if (buildData) {
            try {
                const build = JSON.parse(atob(buildData));
                this.loadBuild(build);
                this.showNotification('从链接加载Build成功！', 'info');
            } catch (e) {
                console.error('Failed to load build from URL:', e);
            }
        }
    }

    // 导出/导入功能
    exportBuild(buildData) {
        const exportData = {
            ...buildData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `anime-raid-build-${Date.now()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showNotification('Build已导出！', 'success');
    }

    importBuild(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const buildData = JSON.parse(e.target.result);
                this.loadBuild(buildData);
                this.showNotification('Build导入成功！', 'success');
            } catch (error) {
                this.showNotification('导入失败：文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 分享按钮增强
        const shareButtons = document.querySelectorAll('[onclick*="shareBuild"]');
        shareButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                if (this.currentBuild) {
                    await this.shareBuild(this.currentBuild);
                }
            });
        });

        // 保存到社区按钮
        const saveButton = document.getElementById('save-to-community');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                if (this.currentBuild) {
                    const buildName = prompt('请输入Build名称：', this.currentBuild.name || 'My Build');
                    if (buildName) {
                        this.currentBuild.name = buildName;
                        this.currentBuild.description = prompt('请输入Build描述：', this.currentBuild.description || '');
                        this.saveBuildToCommunity(this.currentBuild);
                    }
                } else {
                    this.showNotification('请先创建一个Build！', 'warning');
                }
            });
        }

        // 导入按钮
        const importButton = document.getElementById('import-build');
        if (importButton) {
            importButton.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importBuild(file);
                }
            });
        }

        // 导出按钮
        const exportButton = document.getElementById('export-build');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                if (this.currentBuild) {
                    this.exportBuild(this.currentBuild);
                } else {
                    this.showNotification('请先创建一个Build！', 'warning');
                }
            });
        }
    }

    // 通知系统
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type];

        notification.className = `fixed top-20 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // 5秒后移除
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
}

// 全局变量
let buildShareSystem;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 只在Build Calculator页面初始化
    if (window.location.pathname.includes('/tools/build-calculator/')) {
        buildShareSystem = new BuildShareSystem();

        // 添加社区Builds区域
        const resultsPanel = document.querySelector('.lg\\:col-span-2');
        if (resultsPanel) {
            const communitySection = document.createElement('div');
            communitySection.className = 'bg-white rounded-lg shadow-lg p-6 mt-8';
            communitySection.id = 'community-builds';
            resultsPanel.appendChild(communitySection);
        }

        // 添加额外按钮到Hero区域
        const heroButtons = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-4.justify-center');
        if (heroButtons) {
            const additionalButtons = document.createElement('div');
            additionalButtons.className = 'flex flex-wrap gap-2 justify-center mt-4';
            additionalButtons.innerHTML = `
                <button id="save-to-community" class="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors">
                    💾 保存到社区
                </button>
                <button id="export-build" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    📤 导出Build
                </button>
                <label class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                    📥 导入Build
                    <input type="file" id="import-build" accept=".json" class="hidden">
                </label>
            `;
            heroButtons.appendChild(additionalButtons);
        }
    }
});

// 导出到全局作用域
window.buildShareSystem = buildShareSystem;