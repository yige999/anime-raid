// 结构化数据生成器
// 为不同页面生成相应的Schema.org结构化数据

class StructuredDataGenerator {
    // 生成FAQ结构化数据
    static generateFAQSchema(faqData) {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    }

    // 生成HowTo结构化数据
    static generateHowToSchema(title, description, steps, image = null) {
        return {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": title,
            "description": description,
            "image": image,
            "totalTime": "PT5M",
            "supply": [],
            "tool": [],
            "step": steps.map((step, index) => ({
                "@type": "HowToStep",
                "name": step.name,
                "text": step.text,
                "image": step.image,
                "url": step.url || `#step-${index + 1}`
            }))
        };
    }

    // 生成游戏攻略结构化数据
    static generateGameGuideSchema(title, description, author, gameName) {
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {
                "@type": "Organization",
                "name": author
            },
            "publisher": {
                "@type": "Organization",
                "name": "Anime Raid Wiki",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://animeraid.wiki/assets/images/logo.png"
                }
            },
            "datePublished": "2025-10-16",
            "dateModified": new Date().toISOString().split('T')[0],
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            },
            "about": {
                "@type": "VideoGame",
                "name": gameName
            }
        };
    }

    // 生成角色数据库结构化数据
    static generateCharacterSchema(characterData) {
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `${characterData.name} - Anime Raid Character Guide`,
            "description": `Complete guide for ${characterData.name}, a ${characterData.tier}-tier ${characterData.role} character in Anime Raid.`,
            "author": {
                "@type": "Organization",
                "name": "Anime Raid Wiki"
            },
            "datePublished": "2025-10-16",
            "dateModified": new Date().toISOString().split('T')[0],
            "about": {
                "@type": "Thing",
                "name": characterData.name,
                "description": `${characterData.tier}-tier ${characterData.role} character in Anime Raid`,
                "additionalProperty": [
                    {
                        "@type": "PropertyValue",
                        "name": "Tier",
                        "value": characterData.tier
                    },
                    {
                        "@type": "PropertyValue",
                        "name": "Role",
                        "value": characterData.role
                    },
                    {
                        "@type": "PropertyValue",
                        "name": "Element",
                        "value": characterData.element
                    },
                    {
                        "@type": "PropertyValue",
                        "name": "Rating",
                        "value": characterData.rating
                    }
                ]
            }
        };
    }

    // 生成工具页面结构化数据
    static generateSoftwareApplicationSchema(name, description, url) {
        return {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": name,
            "description": description,
            "url": url,
            "applicationCategory": "Game",
            "operatingSystem": "Any",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "author": {
                "@type": "Organization",
                "name": "Anime Raid Wiki"
            },
            "datePublished": "2025-10-16",
            "dateModified": new Date().toISOString().split('T')[0]
        };
    }

    // 动态注入结构化数据到页面
    static injectStructuredData(schemaData) {
        // 移除现有的结构化数据脚本
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('schema.org')) {
                script.remove();
            }
        });

        // 创建新的结构化数据脚本
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schemaData, null, 2);
        document.head.appendChild(script);
    }

    // 根据页面类型自动生成并注入结构化数据
    static autoGenerateStructuredData() {
        const path = window.location.pathname;
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.content || '';

        // 兑换码页面 - 添加FAQ Schema
        if (path.includes('/codes/')) {
            const faqData = [
                {
                    question: "How often are new codes released for Anime Raid?",
                    answer: "New codes are typically released during game updates, special events, holidays, and when the game reaches certain milestones. Check back regularly for the latest codes."
                },
                {
                    question: "Why isn't my Anime Raid code working?",
                    answer: "Codes may not work if they have expired, have already been redeemed, were entered incorrectly, or have reached their redemption limit. Always copy codes exactly as shown and redeem them as soon as possible."
                },
                {
                    question: "Can I use Anime Raid codes more than once?",
                    answer: "No, most codes in Anime Raid can only be redeemed once per account. Make sure to use them on your main account to maximize the benefits."
                }
            ];

            const faqSchema = this.generateFAQSchema(faqData);
            this.injectStructuredData(faqSchema);
        }

        // 新手指南页面 - 添加HowTo Schema
        if (path.includes('beginner-guide')) {
            const howToData = {
                title: "How to Get Started in Anime Raid",
                description: "Complete beginner's guide to start your journey in Anime Raid, from character creation to your first battles.",
                steps: [
                    {
                        name: "Download and Install",
                        text: "Download Anime Raid from your device's app store and complete the installation process."
                    },
                    {
                        name: "Create Your Account",
                        text: "Choose your username, create a secure password, and select your starting server."
                    },
                    {
                        name: "Complete the Tutorial",
                        text: "Follow the in-game tutorial to learn basic controls, combat mechanics, and navigation."
                    },
                    {
                        name: "Choose Your Starting Characters",
                        text: "Select your initial team based on the tier list recommendations and your preferred playstyle."
                    },
                    {
                        name: "Redeem Welcome Codes",
                        text: "Use the welcome codes to get free gems, gold, and other starter resources."
                    }
                ]
            };

            const howToSchema = this.generateHowToSchema(howToData.title, howToData.description, howToData.steps);
            this.injectStructuredData(howToSchema);
        }

        // 竞技场战术页面 - 添加HowTo Schema
        if (path.includes('arena-tactics')) {
            const arenaHowTo = {
                title: "How to Master Arena Battles in Anime Raid",
                description: "Advanced tactics and strategies to dominate PvP arena battles and climb the rankings.",
                steps: [
                    {
                        name: "Build Your Arena Team",
                        text: "Create a balanced team composition with synergistic characters and abilities."
                    },
                    {
                        name: "Learn Team Compositions",
                        text: "Study top-tier team compositions and understand their strengths and weaknesses."
                    },
                    {
                        name: "Master Positioning",
                        text: "Learn optimal positioning strategies to maximize your team's effectiveness."
                    },
                    {
                        name: "Develop Counter Strategies",
                        text: "Prepare specific teams and strategies to counter popular arena compositions."
                    },
                    {
                        name: "Practice and Adapt",
                        text: "Regularly participate in arena battles and adapt your strategies based on results."
                    }
                ]
            };

            const arenaSchema = this.generateHowToSchema(arenaHowTo.title, arenaHowTo.description, arenaHowTo.steps);
            this.injectStructuredData(arenaSchema);
        }

        // 工具页面 - 添加SoftwareApplication Schema
        if (path.includes('/tools/')) {
            if (path.includes('build-calculator')) {
                const toolSchema = this.generateSoftwareApplicationSchema(
                    "Anime Raid Build Calculator",
                    "Calculate optimal character builds, stat distributions, and damage output for Anime Raid characters.",
                    window.location.href
                );
                this.injectStructuredData(toolSchema);
            }

            if (path.includes('drop-simulator')) {
                const toolSchema = this.generateSoftwareApplicationSchema(
                    "Anime Raid Drop Rate Simulator",
                    "Simulate drop rates, calculate farming efficiency, and plan your resource gathering in Anime Raid.",
                    window.location.href
                );
                this.injectStructuredData(toolSchema);
            }
        }

        // 角色页面 - 添加角色专用Schema
        if (path.includes('/database/units/') && path !== '/database/units/') {
            // 从页面内容提取角色信息
            const characterName = document.querySelector('h1')?.textContent || 'Unknown Character';
            const characterData = {
                name: characterName,
                tier: 'S', // 默认值，实际应从页面内容获取
                role: 'DPS',
                element: 'Dark',
                rating: 95
            };

            const characterSchema = this.generateCharacterSchema(characterData);
            this.injectStructuredData(characterSchema);
        }

        // 通用文章Schema - 应用于所有指南页面
        if (path.includes('/guides/')) {
            const guideSchema = this.generateGameGuideSchema(
                title,
                description,
                "Anime Raid Wiki",
                "Anime Raid"
            );
            this.injectStructuredData(guideSchema);
        }
    }
}

// 页面加载完成后自动生成结构化数据
document.addEventListener('DOMContentLoaded', () => {
    StructuredDataGenerator.autoGenerateStructuredData();
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StructuredDataGenerator;
}