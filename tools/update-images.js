const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const config = require('../config/image-sizes.json');

async function processImage(inputPath, size) {
    const filename = path.basename(inputPath);
    const outputDir = size.outputDir;
    const outputPath = path.join(outputDir, filename);

    await fs.mkdirSync(outputDir, { recursive: true });

    const metadata = await sharp(inputPath).metadata();
    
    let width, height;
    const isLandscape = metadata.width > metadata.height;
    
    if (isLandscape) {
        if (metadata.width >= size.maxDimension) {
            width = size.maxDimension;
            height = Math.round((metadata.height * size.maxDimension) / metadata.width);
        } else {
            width = metadata.width;
            height = metadata.height;
        }
    } else {
        if (metadata.height >= size.maxDimension) {
            height = size.maxDimension;
            width = Math.round((metadata.width * size.maxDimension) / metadata.height);
        } else {
            width = metadata.width;
            height = metadata.height;
        }
    }

    let pipeline = sharp(inputPath)
        .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .rotate();

    if (/\.jpe?g$/i.test(filename)) {
        pipeline = pipeline.jpeg({ quality: 90 });
    } else if (/\.png$/i.test(filename)) {
        pipeline = pipeline.png({ quality: 90 });
    }

    await pipeline.toFile(outputPath);

    console.log(`Processed: ${outputPath} (${width}x${height})`);
}

async function processAllImages() {
    try {
        const files = await fs.readdirSync(config.sourceDir);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif)$/i.test(file)
        );

        for (const file of imageFiles) {
            const inputPath = path.join(config.sourceDir, file);
            console.log(`Processing image: ${file}`);

            for (const size of config.sizes) {
                await processImage(inputPath, size);
            }
        }

        console.log('All images processed successfully!');
    } catch (error) {
        console.error('Error processing images:', error);
    }
}

async function updateImageConfig() {
    try {
        const previewDir = path.join(__dirname, '../images/preview');
        const normalDir = path.join(__dirname, '../images/medium');
        const largeDir = path.join(__dirname, '../images/full');
        const configPath = path.join(__dirname, '../config/images.json');

        const previewFiles = fs.readdirSync(previewDir);
        const imageFiles = previewFiles.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        const validImages = imageFiles.filter(file => {
            const previewExists = fs.existsSync(path.join(previewDir, file));
            const normalExists = fs.existsSync(path.join(normalDir, file));
            const largeExists = fs.existsSync(path.join(largeDir, file));
            return previewExists && normalExists && largeExists;
        });

        let existingConfig = {};
        try {
            const existingConfigData = fs.readFileSync(configPath, 'utf8');
            existingConfig = JSON.parse(existingConfigData);
        } catch (error) {
            console.log('No existing configuration found or invalid format, creating new config file');
        }

        const config = {
            ...existingConfig,
            imagesList: validImages
        };

        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdir(configDir, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`Image configuration updated! Found ${validImages.length} valid images`);
    } catch (error) {
        console.error('Error updating image configuration:', error);
    }
}

async function main() {
    await processAllImages();
    await updateImageConfig();
}

main().catch(error => console.error('Error executing program:', error));