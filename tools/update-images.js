const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 读取配置文件
const config = require('../config/image-sizes.json');

async function processImage(inputPath, size) {
    const filename = path.basename(inputPath);
    const outputDir = size.outputDir;
    const outputPath = path.join(outputDir, filename);

    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });

    // 获取图片信息
    const metadata = await sharp(inputPath).metadata();
    
    // 计算新的尺寸，保持原始方向
    let width, height;
    const isLandscape = metadata.width > metadata.height;
    
    if (isLandscape) {
        // 横向图片
        if (metadata.width >= size.maxDimension) {
            width = size.maxDimension;
            height = Math.round((metadata.height * size.maxDimension) / metadata.width);
        } else {
            width = metadata.width;
            height = metadata.height;
        }
    } else {
        // 纵向图片
        if (metadata.height >= size.maxDimension) {
            height = size.maxDimension;
            width = Math.round((metadata.width * size.maxDimension) / metadata.height);
        } else {
            width = metadata.width;
            height = metadata.height;
        }
    }

    // 处理图片，保持方向
    await sharp(inputPath)
        .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .rotate() // 自动根据 EXIF 数据旋转
        .toFile(outputPath);

    console.log(`处理完成: ${outputPath} (${width}x${height})`);
}

async function processAllImages() {
    try {
        // 读取源目录中的所有图片
        const files = await fs.readdir(config.sourceDir);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif)$/i.test(file)
        );

        // 处理每张图片
        for (const file of imageFiles) {
            const inputPath = path.join(config.sourceDir, file);
            console.log(`处理图片: ${file}`);

            // 为每个尺寸处理图片
            for (const size of config.sizes) {
                await processImage(inputPath, size);
            }
        }

        console.log('所有图片处理完成！');
    } catch (error) {
        console.error('处理图片时出错:', error);
    }
}

processAllImages();
