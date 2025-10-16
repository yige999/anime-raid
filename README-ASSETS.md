# Anime Raid Wiki - 静态资源文件

## 📁 资源文件结构

### 🖼️ 图片文件 (Images)

#### `/assets/images/`
- **logo.svg** - 网站Logo (SVG矢量图，可转换为PNG)
  - 尺寸：200x50px
  - 渐变色彩：蓝色到紫色
  - 可缩放，支持高分辨率显示

- **hero-bg.svg** - 主页背景图 (SVG矢量图，可转换为JPG)
  - 尺寸：1920x600px
  - 游戏主题背景
  - 包含角色剪影和动画效果

#### `/assets/images/characters/`
- **shadow-assassin.svg** - 暗影刺客头像
  - 尺寸：120x120px
  - 黑暗主题配色
  - 包含发光效果

- **holy-priest.svg** - 神圣牧师头像
  - 尺寸：120x120px
  - 金色主题配色
  - 包含治疗光环效果

### 🎯 图标文件 (Icons)

#### `/assets/icons/`
- **favicon.svg** - 网站图标 (SVG矢量图，可转换为ICO)
  - 尺寸：32x32px
  - 简洁的"AR"标识
  - 渐变背景

- **codes-icon.svg** - 兑换码图标
  - 尺寸：64x64px
  - 礼物盒设计
  - 绿色主题

- **tier-icon.svg** - 排行榜图标
  - 尺寸：64x64px
  - 奖杯设计
  - 金色主题

- **database-icon.svg** - 数据库图标
  - 尺寸：64x64px
  - 数据库圆柱设计
  - 紫色主题

## 📋 使用说明

### 图片格式转换
所有SVG文件都可以转换为其他格式：

```bash
# SVG转PNG (使用在线工具或命令行)
inkscape --export-png=logo.png --export-width=200 --export-height=50 logo.svg

# SVG转JPG (需要白色背景)
inkscape --export-jpg=hero-bg.jpg --export-width=1920 --export-height=600 hero-bg.svg

# SVG转ICO (用于favicon)
# 使用在线favicon生成器或专门的图标工具
```

### 优化建议

1. **Logo优化**：
   - 保持SVG格式用于缩放
   - 创建多个尺寸的PNG版本 (32x32, 64x64, 128x128, 200x50)

2. **Favicon优化**：
   - 生成标准ICO文件包含：16x16, 32x32, 48x48
   - 同时保留SVG版本用于现代浏览器

3. **背景图片优化**：
   - 可以转换为WebP格式以减少文件大小
   - 压缩后目标大小：<200KB

4. **角色头像优化**：
   - 创建缩略图版本 (64x64)
   - 考虑添加更多角色头像

## 🚀 部署检查清单

### 文件完整性
- [x] `/assets/images/logo.svg` ✅
- [x] `/assets/images/hero-bg.svg` ✅
- [x] `/assets/images/characters/shadow-assassin.svg` ✅
- [x] `/assets/images/characters/holy-priest.svg` ✅
- [x] `/assets/icons/favicon.svg` ✅
- [x] `/assets/icons/codes-icon.svg` ✅
- [x] `/assets/icons/tier-icon.svg` ✅
- [x] `/assets/icons/database-icon.svg` ✅

### 引用检查
确保HTML文件正确引用这些资源：

```html
<!-- Logo引用 -->
<img src="assets/images/logo.svg" alt="Anime Raid Wiki">

<!-- Favicon引用 -->
<link rel="icon" type="image/x-icon" href="assets/icons/favicon.ico">

<!-- 背景图片引用 -->
<style>
  .hero-section {
    background-image: url('assets/images/hero-bg.svg');
  }
</style>
```

### 备用格式
为更好的浏览器兼容性，建议创建：

- `logo.png` - PNG格式的Logo
- `favicon.ico` - ICO格式的网站图标
- `hero-bg.webp` - WebP格式的背景图（可选）
- `character-avatar.png` - PNG格式的角色头像

## 🔧 维护说明

### 添加新图片
1. 创建SVG源文件
2. 导出为需要的格式
3. 添加到此README文档
4. 更新相关HTML引用

### 图片优化
1. 使用压缩工具减少文件大小
2. 确保响应式设计
3. 提供多种格式支持
4. 定期检查加载性能

### 品牌一致性
- 使用统一的色彩方案
- 保持设计风格一致
- 确保所有图片质量达标
- 定期更新设计元素

## 📈 性能优化

### 当前文件大小估算
- Logo SVG: ~2KB
- Favicon SVG: ~1KB
- Hero Background SVG: ~8KB
- Character Avatars SVG: ~3KB each
- Icons SVG: ~1KB each

### 优化目标
- 首页加载时间 < 2秒
- 图片文件总体积 < 500KB
- 支持现代图片格式 (WebP, AVIF)
- 实现懒加载功能

---

**创建日期**: 2025-10-16
**最后更新**: 2025-10-16
**维护者**: Anime Raid Wiki Team