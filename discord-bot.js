/**
 * Discord Bot for Anime Raid Wiki
 * 监听Discord服务器公告和消息，自动提取兑换码
 *
 * 安装依赖：npm install discord.js
 * 运行：node discord-bot.js
 *
 * 需要在Discord Developer Portal创建Bot并获取Token
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Discord Bot配置
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const TARGET_CHANNELS = ['announcements', 'updates', 'gift-codes', 'general'];
const TARGET_SERVERS = ['YOUR_SERVER_ID']; // 添加要监听的服务器ID

// 创建Discord客户端
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 兑换码提取器
class CodeExtractor {
    static extractCodes(text) {
        const codes = [];
        const codePatterns = [
            /\b([A-Z0-9]{8,20})\b/g,
            /\b(GIFT|CODE|PROMO|REDEEM)[-_]?([A-Z0-9]{6,16})\b/gi,
            /\b([A-Z]{3,}[-_]?[0-9]{3,})\b/g,
            /['""]([A-Z0-9]{8,20})['""]/g,
            /\b(ANIME|RAID|GAME)[-_]?([A-Z0-9]{4,12})\b/gi
        ];

        codePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const code = match[1] || match[0];
                if (this.isValidCode(code)) {
                    codes.push({
                        code: code,
                        context: this.extractContext(text, code),
                        confidence: this.calculateConfidence(code, text)
                    });
                }
            }
        });

        // 去重并按置信度排序
        const uniqueCodes = codes.filter((code, index, self) =>
            index === self.findIndex(c => c.code.toLowerCase() === code.code.toLowerCase())
        );

        return uniqueCodes.sort((a, b) => b.confidence - a.confidence);
    }

    static isValidCode(code) {
        if (code.length < 6 || code.length > 25) return false;

        const excludeWords = [
            'AND', 'THE', 'FOR', 'WITH', 'HAVE', 'THIS', 'THAT', 'FROM',
            'THEY', 'BEEN', 'WERE', 'BEING', 'DID', 'HIS', 'HER', 'ITS'
        ];
        if (excludeWords.includes(code)) return false;

        const hasNumber = /\d/.test(code);
        const hasLetter = /[A-Z]/.test(code);
        return hasNumber || hasLetter;
    }

    static extractContext(text, code) {
        const index = text.indexOf(code);
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + code.length + 100);
        return text.substring(start, end).trim();
    }

    static calculateConfidence(code, text) {
        let confidence = 0.5;

        if (code.length >= 8 && code.length <= 16) confidence += 0.2;
        if (/\d/.test(code)) confidence += 0.1;

        const keywords = ['code', 'gift', 'promo', 'redeem', 'claim', 'reward', 'free'];
        const hasKeywords = keywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
        if (hasKeywords) confidence += 0.2;

        if (/^[A-Z0-9_-]+$/.test(code)) confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    static extractRewards(text) {
        const rewardPatterns = {
            'diamond|gem': '💎 Gems',
            'gold|coin': '💰 Gold',
            'ticket|summon': '🎫 Summon Tickets',
            'potion|energy': '⚡ Energy Potions',
            'stamina': '💪 Stamina',
            'exp|experience': '📚 Experience Books'
        };

        for (const [pattern, reward] of Object.entries(rewardPatterns)) {
            if (new RegExp(pattern, 'i').test(text)) {
                return reward;
            }
        }

        return 'Various rewards';
    }
}

// 消息处理器
class MessageHandler {
    static async handleMessage(message) {
        // 忽略机器人消息
        if (message.author.bot) return;

        // 忽略私信
        if (!message.guild) return;

        // 检查是否在目标频道
        const channelName = message.channel.name.toLowerCase();
        const isTargetChannel = TARGET_CHANNELS.some(target =>
            channelName.includes(target)
        );

        if (!isTargetChannel) return;

        // 提取兑换码
        const codes = CodeExtractor.extractCodes(message.content);

        if (codes.length === 0) return;

        console.log(`Found ${codes.length} potential codes in ${message.channel.name}`);

        // 处理找到的兑换码
        for (const codeData of codes) {
            if (codeData.confidence > 0.7) {
                await this.processCode(codeData, message);
            }
        }
    }

    static async processCode(codeData, message) {
        try {
            // 创建兑换码信息
            const codeInfo = {
                code: codeData.code,
                rewards: CodeExtractor.extractRewards(codeData.context),
                description: `Auto-scraped from Discord #${message.channel.name}`,
                source: 'discord',
                sourceUrl: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
                author: message.author.tag,
                channel: message.channel.name,
                foundAt: message.createdAt.toISOString(),
                confidence: codeData.confidence
            };

            // 发送到前端处理
            await this.sendToFrontend(codeInfo);

            // 可选：在Discord中回复确认
            if (Math.random() < 0.3) { // 30%概率回复，避免刷屏
                await this.sendConfirmation(message, codeData.code);
            }

            console.log(`Processed code: ${codeData.code} from ${message.author.tag}`);

        } catch (error) {
            console.error('Error processing code:', error);
        }
    }

    static async sendToFrontend(codeInfo) {
        try {
            // 发送到本地API端点
            const response = await fetch('http://localhost:3000/api/discord/new-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(codeInfo)
            });

            if (!response.ok) {
                console.error('Failed to send code to frontend:', response.statusText);
            }
        } catch (error) {
            console.error('Error sending code to frontend:', error);
        }
    }

    static async sendConfirmation(message, code) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎁 兑换码已自动抓取')
                .setDescription(`兑换码 **${code}** 已添加到数据库`)
                .addFields(
                    { name: '来源', value: `#${message.channel.name}`, inline: true },
                    { name: '作者', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error sending confirmation:', error);
        }
    }
}

// 统计和监控
class StatsMonitor {
    constructor() {
        this.stats = {
            messagesProcessed: 0,
            codesFound: 0,
            lastActivity: null,
            errors: 0
        };
    }

    incrementMessages() {
        this.stats.messagesProcessed++;
        this.stats.lastActivity = new Date();
    }

    incrementCodes() {
        this.stats.codesFound++;
    }

    incrementErrors() {
        this.stats.errors++;
    }

    getStats() {
        return {
            ...this.stats,
            uptime: client.uptime,
            guilds: client.guilds.cache.size,
            channels: client.channels.cache.size
        };
    }
}

const statsMonitor = new StatsMonitor();

// Discord客户端事件
client.once('ready', async () => {
    console.log(`✅ Discord Bot已登录: ${client.user.tag}`);
    console.log(`📊 监听 ${client.guilds.cache.size} 个服务器`);

    // 设置机器人状态
    client.user.setActivity('兑换码监控中...', { type: 'WATCHING' });

    // 定期输出统计信息
    setInterval(() => {
        const stats = statsMonitor.getStats();
        console.log(`📈 统计: 消息 ${stats.messagesProcessed}, 兑换码 ${stats.codesFound}, 错误 ${stats.errors}`);
    }, 300000); // 每5分钟
});

client.on('messageCreate', async (message) => {
    try {
        statsMonitor.incrementMessages();
        await MessageHandler.handleMessage(message);
    } catch (error) {
        console.error('Error handling message:', error);
        statsMonitor.incrementErrors();
    }
});

client.on('guildCreate', (guild) => {
    console.log(`🎯 加入新服务器: ${guild.name} (${guild.id})`);
});

client.on('guildDelete', (guild) => {
    console.log(`👋 离开服务器: ${guild.name} (${guild.id})`);
});

// 错误处理
client.on('error', (error) => {
    console.error('Discord client error:', error);
    statsMonitor.incrementErrors();
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    statsMonitor.incrementErrors();
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('正在关闭Discord Bot...');
    client.destroy();
    process.exit(0);
});

// 启动机器人
if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    client.login(BOT_TOKEN);
} else {
    console.error('❌ 请设置有效的DISCORD_BOT_TOKEN环境变量');
    console.log('📝 在Discord Developer Portal创建Bot: https://discord.com/developers/applications');
    console.log('💡 设置方式: export DISCORD_BOT_TOKEN="your_token_here"');
}

// 导出模块供测试使用
module.exports = {
    client,
    CodeExtractor,
    MessageHandler,
    StatsMonitor
};