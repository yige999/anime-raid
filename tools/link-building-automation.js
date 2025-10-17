/**
 * Anime Raid Wiki - 外链建设自动化工具
 *
 * 警告：此工具仅用于合法的、个性化的外链建设
 * 绝不用于发送垃圾邮件或自动化垃圾外链
 */

class LinkBuildingAutomation {
    constructor() {
        this.prospects = [];
        this.emailsSent = [];
        this.followUps = [];
        this.settings = {
            emailsPerDay: 30,
            followUpDays: [3, 7, 14],
            workingHours: { start: 9, end: 17 },
            timezone: 'Asia/Shanghai'
        };
    }

    // 1. 分析竞争对手外链
    analyzeCompetitorLinks(competitorBacklinks) {
        const analysis = {
            total: competitorBacklinks.length,
            highQuality: [],
            mediumQuality: [],
            lowQuality: [],
            opportunities: []
        };

        competitorBacklinks.forEach(link => {
            const quality = this.assessLinkQuality(link);

            if (quality.score >= 80) {
                analysis.highQuality.push(link);
                if (quality.canReplicate) {
                    analysis.opportunities.push(link);
                }
            } else if (quality.score >= 50) {
                analysis.mediumQuality.push(link);
            } else {
                analysis.lowQuality.push(link);
            }
        });

        return analysis;
    }

    // 评估外链质量
    assessLinkQuality(link) {
        let score = 0;
        const factors = {};

        // 域名权重评分 (最高30分)
        if (link.domainAuthority >= 50) {
            score += 30;
            factors.da = 30;
        } else if (link.domainAuthority >= 30) {
            score += 20;
            factors.da = 20;
        } else if (link.domainAuthority >= 15) {
            score += 10;
            factors.da = 10;
        }

        // 流量评分 (最高25分)
        if (link.monthlyTraffic >= 10000) {
            score += 25;
            factors.traffic = 25;
        } else if (link.monthlyTraffic >= 1000) {
            score += 15;
            factors.traffic = 15;
        } else if (link.monthlyTraffic >= 100) {
            score += 5;
            factors.traffic = 5;
        }

        // 相关性评分 (最高25分)
        const relevanceKeywords = [
            'anime', 'manga', 'game', 'gaming', 'mobile', '攻略', '游戏',
            'anime raid', 'gacha', 'rpg', 'character', 'tier list'
        ];

        const relevanceScore = relevanceKeywords.reduce((acc, keyword) => {
            if (link.title.toLowerCase().includes(keyword) ||
                link.description.toLowerCase().includes(keyword)) {
                return acc + 5;
            }
            return acc;
        }, 0);

        score += Math.min(relevanceScore, 25);
        factors.relevance = Math.min(relevanceScore, 25);

        // 外链数量评分 (最高20分)
        if (link.outboundLinks <= 10) {
            score += 20;
            factors.outboundLinks = 20;
        } else if (link.outboundLinks <= 25) {
            score += 10;
            factors.outboundLinks = 10;
        } else if (link.outboundLinks <= 50) {
            score += 5;
            factors.outboundLinks = 5;
        }

        return {
            score,
            factors,
            canReplicate: score >= 60 && link.contactEmail,
            tier: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
        };
    }

    // 2. 生成个性化邮件
    generatePersonalizedEmail(prospect, template = 'initial') {
        const templates = {
            initial: {
                subject: `关于${prospect.websiteName}的优质游戏资源推荐`,
                body: this.generateInitialEmailBody(prospect)
            },
            followup: {
                subject: `跟进：Anime Raid Wiki资源合作`,
                body: this.generateFollowUpEmailBody(prospect)
            },
            final: {
                subject: `最后联系：游戏内容合作机会`,
                body: this.generateFinalEmailBody(prospect)
            }
        };

        return templates[template];
    }

    generateInitialEmailBody(prospect) {
        const personalizedIntro = this.getPersonalizedIntro(prospect);
        const valueProposition = this.getValueProposition(prospect);
        const callToAction = this.getCallToAction(prospect);

        return `
${personalizedIntro}

${valueProposition}

我们的核心资源包括：
✅ 150+ 角色详细数据和深度分析
✅ 每日更新的兑换码验证系统
✅ 专业制作的S级角色排行榜
✅ 实用的游戏工具（构建计算器、掉率模拟器）
✅ 详细的新手入门和进阶攻略

${callToAction}

如果您对我们的资源感兴趣，或者有任何合作建议，请随时回复邮件。

祝好！

${this.getSignature()}
        `.trim();
    }

    getPersonalizedIntro(prospect) {
        const intros = [
            `尊敬的${prospect.contactName || prospect.websiteName}管理员，`,
            `您好！我是Anime Raid Wiki的创始人。`,
            `您好，我在${prospect.websiteName}上看到了您分享的优质内容。`
        ];

        // 根据网站类型选择最合适的开场白
        if (prospect.websiteType === 'blog') {
            return intros[2];
        } else if (prospect.contactName) {
            return intros[0];
        } else {
            return intros[1];
        }
    }

    getValueProposition(prospect) {
        const propositions = {
            directory: '我注意到您的网站是优质游戏资源的集合地，相信Anime Raid Wiki的内容能为您的访问者提供很好的参考价值。',
            blog: '作为游戏内容创作者，您可能对高质量的游戏数据和分析工具感兴趣。我们的网站提供专业的Anime Raid游戏数据和分析。',
            forum: '我看到您的社区有很多Anime Raid玩家讨论。我们的专业数据和工具可能对社区成员很有帮助。',
            general: '我们专注于为Anime Raid玩家提供最全面、最准确的游戏数据和攻略内容。'
        };

        return propositions[prospect.websiteType] || propositions.general;
    }

    getCallToAction(prospect) {
        const actions = {
            directory: '您是否考虑在您的资源页面添加我们网站的链接？',
            blog: '您是否愿意考虑我们的网站作为资源推荐，或者有兴趣进行内容合作？',
            forum: '您是否愿意在相关板块分享我们的资源，或者考虑合作？',
            general: '您是否考虑在您的网站上添加我们的链接，或者探讨其他合作方式？'
        };

        return actions[prospect.websiteType] || actions.general;
    }

    getSignature() {
        return `
[您的姓名]
Anime Raid Wiki 创始人
网站：https://animeraid.wiki/
邮箱：your-email@animeraid.wiki

我们的核心页面：
• 代码中心：https://animeraid.wiki/codes/
• 角色排行：https://animeraid.wiki/tier-lists/
• 角色数据库：https://animeraid.wiki/database/units/
• 游戏工具：https://animeraid.wiki/tools/
        `.trim();
    }

    // 3. 外链机会管理
    addProspect(prospect) {
        const validatedProspect = this.validateProspect(prospect);
        if (validatedProspect) {
            this.prospects.push({
                ...validatedProspect,
                id: Date.now().toString(),
                status: 'new',
                addedDate: new Date(),
                lastContactDate: null,
                followUpDates: [],
                notes: ''
            });
        }
    }

    validateProspect(prospect) {
        const required = ['websiteUrl', 'websiteName'];
        const missing = required.filter(field => !prospect[field]);

        if (missing.length > 0) {
            console.warn('缺少必要字段:', missing);
            return null;
        }

        // 验证URL格式
        try {
            new URL(prospect.websiteUrl);
        } catch (e) {
            console.warn('无效的URL:', prospect.websiteUrl);
            return null;
        }

        return prospect;
    }

    // 4. 邮件发送管理
    async scheduleEmails() {
        const today = new Date();
        const emailsToSchedule = this.getEmailsForScheduling(today);

        for (const prospect of emailsToSchedule) {
            if (this.isWithinWorkingHours(today)) {
                await this.sendEmail(prospect);
                this.markEmailAsSent(prospect.id);
                this.scheduleFollowUps(prospect);

                // 控制发送频率，避免被标记为垃圾邮件
                await this.delay(2000); // 2秒间隔
            }
        }
    }

    isWithinWorkingHours(date) {
        const hours = date.getHours();
        const day = date.getDay();

        // 工作日 9:00-17:00
        return day >= 1 && day <= 5 &&
               hours >= this.settings.workingHours.start &&
               hours < this.settings.workingHours.end;
    }

    async sendEmail(prospect) {
        const email = this.generatePersonalizedEmail(prospect);

        // 这里集成实际的邮件发送服务
        // 例如：Gmail API, SendGrid, Mailgun等
        console.log(`发送邮件到 ${prospect.contactEmail || prospect.contactPerson}`);
        console.log(`主题: ${email.subject}`);
        console.log(`内容预览: ${email.body.substring(0, 100)}...`);

        // 实际发送邮件的代码
        // await this.emailService.send({
        //     to: prospect.contactEmail,
        //     subject: email.subject,
        //     body: email.body
        // });

        return true;
    }

    markEmailAsSent(prospectId) {
        const prospect = this.prospects.find(p => p.id === prospectId);
        if (prospect) {
            prospect.status = 'contacted';
            prospect.lastContactDate = new Date();

            this.emailsSent.push({
                prospectId,
                sentDate: new Date(),
                type: 'initial'
            });
        }
    }

    scheduleFollowUps(prospect) {
        this.settings.followUpDays.forEach(days => {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + days);

            prospect.followUpDates.push({
                date: followUpDate,
                type: days === this.settings.followUpDays[this.settings.followUpDays.length - 1] ? 'final' : 'followup'
            });
        });
    }

    // 5. 跟进管理
    async processFollowUps() {
        const today = new Date();
        const dueFollowUps = this.getDueFollowUps(today);

        for (const followUp of dueFollowUps) {
            const prospect = this.prospects.find(p => p.id === followUp.prospectId);
            if (prospect && this.isWithinWorkingHours(today)) {
                await this.sendFollowUpEmail(prospect, followUp.type);
                this.markFollowUpAsSent(followUp.id);
                await this.delay(2000);
            }
        }
    }

    async sendFollowUpEmail(prospect, followUpType) {
        const email = this.generatePersonalizedEmail(prospect, followUpType);

        console.log(`发送跟进邮件到 ${prospect.contactEmail}`);
        console.log(`类型: ${followUpType}`);

        // 实际发送邮件
        // await this.emailService.send({...});

        return true;
    }

    getDueFollowUps(date) {
        const dueFollowUps = [];

        this.prospects.forEach(prospect => {
            prospect.followUpDates.forEach(followUp => {
                if (followUp.date <= date && !followUp.sent) {
                    dueFollowUps.push({
                        id: `${prospect.id}-${followUp.date.getTime()}`,
                        prospectId: prospect.id,
                        type: followUp.type,
                        date: followUp.date
                    });
                }
            });
        });

        return dueFollowUps.sort((a, b) => a.date - b.date);
    }

    // 6. 报告和分析
    generateReport() {
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const stats = {
            totalProspects: this.prospects.length,
            contactedCount: this.prospects.filter(p => p.status === 'contacted').length,
            respondedCount: this.prospects.filter(p => p.status === 'responded').length,
            successCount: this.prospects.filter(p => p.status === 'success').length,

            emailsThisMonth: this.emailsSent.filter(e => e.sentDate >= thisMonth).length,

            topPerformingTemplates: this.analyzeTemplatePerformance(),

            averageResponseRate: this.calculateResponseRate(),

            linksAcquiredThisMonth: this.countLinksAcquired(thisMonth)
        };

        return {
            date: today.toISOString(),
            stats,
            recommendations: this.generateRecommendations(stats)
        };
    }

    analyzeTemplatePerformance() {
        // 分析不同邮件模板的回复率
        const templateStats = {};

        this.emailsSent.forEach(email => {
            const template = email.type || 'initial';
            if (!templateStats[template]) {
                templateStats[template] = { sent: 0, responded: 0 };
            }
            templateStats[template].sent++;

            const prospect = this.prospects.find(p => p.id === email.prospectId);
            if (prospect && prospect.status === 'responded') {
                templateStats[template].responded++;
            }
        });

        Object.keys(templateStats).forEach(template => {
            const stats = templateStats[template];
            stats.responseRate = (stats.responded / stats.sent * 100).toFixed(1);
        });

        return templateStats;
    }

    calculateResponseRate() {
        const contacted = this.prospects.filter(p => p.status === 'contacted' || p.status === 'responded' || p.status === 'success');
        const responded = this.prospects.filter(p => p.status === 'responded' || p.status === 'success');

        return contacted.length > 0 ? (responded.length / contacted.length * 100).toFixed(1) : 0;
    }

    countLinksAcquired(sinceDate) {
        return this.prospects.filter(p =>
            p.status === 'success' &&
            p.successDate &&
            p.successDate >= sinceDate
        ).length;
    }

    generateRecommendations(stats) {
        const recommendations = [];

        if (parseFloat(stats.averageResponseRate) < 15) {
            recommendations.push('回复率偏低，建议优化邮件主题和内容个性化');
        }

        if (stats.emailsThisMonth < 100) {
            recommendations.push('增加邮件发送量，目标是每月至少100封个性化邮件');
        }

        if (stats.linksAcquiredThisMonth < 10) {
            recommendations.push('调整目标网站筛选标准，专注于更相关的高质量网站');
        }

        return recommendations;
    }

    // 工具方法
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 导出和导入数据
    exportData() {
        return {
            prospects: this.prospects,
            emailsSent: this.emailsSent,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.prospects) this.prospects = data.prospects;
        if (data.emailsSent) this.emailsSent = data.emailsSent;
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
    }
}

// 使用示例
const linkBuilder = new LinkBuildingAutomation();

// 从竞争对手外链数据中添加机会
const competitorLinks = [
    {
        websiteUrl: 'https://example-game-blog.com',
        websiteName: 'Example Game Blog',
        domainAuthority: 45,
        monthlyTraffic: 5000,
        contactEmail: 'admin@example.com',
        websiteType: 'blog',
        title: 'Best Mobile Games 2025',
        description: 'Comprehensive guide to mobile gaming'
    }
    // 添加更多竞争对手外链...
];

const analysis = linkBuilder.analyzeCompetitorLinks(competitorLinks);
console.log('发现的高质量外链机会:', analysis.opportunities.length);

// 添加机会到潜在客户列表
analysis.opportunities.forEach(opportunity => {
    linkBuilder.addProspect(opportunity);
});

// 开始自动化邮件发送（实际使用时需要定时调用）
// linkBuilder.scheduleEmails();
// linkBuilder.processFollowUps();

// 生成报告
const report = linkBuilder.generateReport();
console.log('外链建设报告:', report);

// 导出数据用于备份
const data = linkBuilder.exportData();
console.log('导出的数据大小:', JSON.stringify(data).length, '字符');

module.exports = LinkBuildingAutomation;