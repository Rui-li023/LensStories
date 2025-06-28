const fs = require('fs');
const path = require('path');

const previewDir = path.join(__dirname, '../images/preview');
const configPath = path.join(__dirname, '../config/images.json');

// 读取预览图文件夹中的所有图片
const imageFiles = fs.readdirSync(previewDir)
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

// 更新配置文件
const config = {
    imagesList: imageFiles
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('图片配置已更新！');
