// Favicon转换脚本
// 在Node.js环境中运行以生成真正的ICO文件

const fs = require('fs');
const path = require('path');

// 这个脚本用于在构建时生成真正的ICO文件
// 实际部署时请使用以下方法之一：

console.log('🎨 Favicon转换指南\n');

console.log('方法1: 使用ImageMagick (推荐)');
console.log('```bash');
console.log('# 安装ImageMagick');
console.log('# Windows: choco install imagemagick');
console.log('# Mac: brew install imagemagick');
console.log('# Linux: sudo apt-get install imagemagick');
console.log('');
console.log('# 转换命令');
console.log('convert assets/icons/favicon-32.png assets/icons/favicon-16.png assets/icons/favicon.ico');
console.log('```\n');

console.log('方法2: 使用在线转换器');
console.log('1. 访问 https://favicon.io/favicon-converter/');
console.log('2. 上传 favicon-32.png');
console.log('3. 下载生成的 favicon.ico');
console.log('4. 替换 assets/icons/favicon.ico\n');

console.log('方法3: 使用Node.js包');
console.log('```bash');
console.log('npm install -g png-to-ico');
console.log('png-to-ico assets/icons/favicon-32.png assets/icons/favicon-16.png -o assets/icons/favicon.ico');
console.log('```\n');

console.log('验证ICO文件质量:');
console.log('- 文件大小应该在 1-4KB 之间');
console.log('- 支持 16x16px 和 32x32px 两种尺寸');
console.log('- 在不同浏览器中测试显示效果\n');

// 创建构建脚本
const buildScript = `
#!/bin/bash
echo "🎨 生成Favicon文件..."

# 检查ImageMagick是否安装
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick未安装，请先安装ImageMagick"
    echo "安装方法: https://imagemagick.org/script/download.php"
    exit 1
fi

# 转换SVG到PNG
echo "📝 转换SVG到PNG..."
convert assets/icons/favicon.svg -resize 32x32 assets/icons/favicon-32.png
convert assets/icons/favicon.svg -resize 16x16 assets/icons/favicon-16.png

# 生成ICO文件
echo "🔄 生成ICO文件..."
convert assets/icons/favicon-32.png assets/icons/favicon-16.png assets/icons/favicon.ico

echo "✅ Favicon生成完成！"
echo "📁 文件位置: assets/icons/favicon.ico"
`;

fs.writeFileSync(path.join(__dirname, 'build-favicon.sh'), buildScript);
console.log('✅ 已创建构建脚本: build-favicon.sh');
console.log('在Linux/Mac上运行: chmod +x build-favicon.sh && ./build-favicon.sh\n');

// Windows批处理脚本
const batchScript = `@echo off
echo 🎨 生成Favicon文件...

REM 检查ImageMagick是否安装
convert -version >nul 2>&1
if errorlevel 1 (
    echo ❌ ImageMagick未安装，请先安装ImageMagick
    echo 下载地址: https://imagemagick.org/script/download.php
    pause
    exit /b 1
)

REM 转换SVG到PNG
echo 📝 转换SVG到PNG...
convert assets\\icons\\favicon.svg -resize 32x32 assets\\icons\\favicon-32.png
convert assets\\icons\\favicon.svg -resize 16x16 assets\\icons\\favicon-16.png

REM 生成ICO文件
echo 🔄 生成ICO文件...
convert assets\\icons\\favicon-32.png assets\\icons\\favicon-16.png assets\\icons\\favicon.ico

echo ✅ Favicon生成完成！
echo 📁 文件位置: assets\\icons\\favicon.ico
pause
`;

fs.writeFileSync(path.join(__dirname, 'build-favicon.bat'), batchScript);
console.log('✅ 已创建Windows批处理脚本: build-favicon.bat');
console.log('在Windows上运行: build-favicon.bat\n');

console.log('🎯 优先级建议:');
console.log('1. 立即: 使用在线转换器快速修复');
console.log('2. 短期: 安装ImageMagick进行批量处理');
console.log('3. 长期: 集成到构建流程中\n');