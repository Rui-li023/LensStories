const sharp = require('sharp');
const fs = require('fs');
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
    let pipeline = sharp(inputPath)
        .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .rotate(); // 自动根据 EXIF 数据旋转

    if (/\.jpe?g$/i.test(filename)) {
        pipeline = pipeline.jpeg({ quality: 90 });
    } else if (/\.png$/i.test(filename)) {
        pipeline = pipeline.png({ quality: 90 });
    }

    await pipeline.toFile(outputPath);

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

async function updateImageConfig() {
    try {
        const previewDir = path.join(__dirname, '../images/preview');
        const normalDir = path.join(__dirname, '../images/medium');
        const largeDir = path.join(__dirname, '../images/full');
        const configPath = path.join(__dirname, '../config/images.json');

        // 读取预览图文件夹中的所有图片
        const previewFiles = await fs.readdirSync(previewDir);
        const imageFiles = previewFiles.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        // console.log(previewFiles)
        // 验证每个图片在所有尺寸文件夹中都存在
        const validImages = imageFiles.filter(file => {
            const previewExists = fs.existsSync(path.join(previewDir, file));
            const normalExists = fs.existsSync(path.join(normalDir, file));
            const largeExists = fs.existsSync(path.join(largeDir, file));
            return previewExists && normalExists && largeExists;
        });

        // 读取现有的配置文件（如果存在）
        let existingConfig = {};
        try {
            const existingConfigData = await fs.readFileSync(configPath, 'utf8');
            existingConfig = JSON.parse(existingConfigData);
        } catch (error) {
            console.log('没有找到现有配置文件或文件格式错误，将创建新的配置文件');
        }

        // 合并现有配置和经过验证的图片列表
        const config = {
            ...existingConfig,
            imagesList: validImages
        };

        // 确保配置文件目录存在
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            await fs.mkdir(configDir, { recursive: true });
        }

        // 更新配置文件
        await fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`图片配置已更新！共有 ${validImages.length} 张图片符合要求`);
    } catch (error) {
        console.error('更新图片配置时出错:', error);
    }
}

async function main() {
    // await processAllImages();
    await updateImageConfig();
}

main().catch(error => console.error('程序执行出错:', error));