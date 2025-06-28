const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(cors());
app.use(express.static('../'));

// 存储文件路径
const LIKES_FILE = path.join(__dirname, 'likes.csv');

// 确保likes.csv文件存在
async function ensureLikesFile() {
    try {
        await fs.access(LIKES_FILE);
    } catch {
        await fs.writeFile(LIKES_FILE, 'imageId,likes\n');
    }
}

// 读取CSV数据
async function readCsvData() {
    await ensureLikesFile();
    const data = await fs.readFile(LIKES_FILE, 'utf8');
    return data.trim().split('\n');
}

// 保存CSV数据
async function writeCsvData(lines) {
    await fs.writeFile(LIKES_FILE, lines.join('\n'));
}

// 查找图片在CSV中的行索引
function findImageIndex(lines, imageId) {
    return lines.findIndex((line, index) => 
        index > 0 && line.startsWith(imageId + ',')
    );
}

// 添加操作限制相关的常量和缓存
const OPERATION_COOLDOWN = 1000; // 1秒冷却时间
const operationCache = new Map(); // 存储操作时间戳

// 检查操作是否允许
function isOperationAllowed(imageId, operation) {
    const key = `${imageId}-${operation}`;
    const lastOperation = operationCache.get(key) || 0;
    const now = Date.now();
    
    if (now - lastOperation < OPERATION_COOLDOWN) {
        return false;
    }
    
    operationCache.set(key, now);
    return true;
}

// API路由
app.get('/api/likes', async (req, res) => {
    try {
        const lines = await readCsvData();
        const result = {};
        lines.slice(1).forEach(line => {
            const [imageId, likes] = line.split(',');
            result[imageId] = parseInt(likes);
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get likes' });
    }
});

app.post('/api/likes/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;
        
        // 检查操作限制
        if (!isOperationAllowed(imageId, 'like')) {
            return res.status(429).json({ error: '操作过于频繁，请稍后再试' });
        }

        const lines = await readCsvData();
        const imageIndex = findImageIndex(lines, imageId);
        
        if (imageIndex === -1) {
            lines.push(`${imageId},1`);
            await writeCsvData(lines);
            res.json({ likes: 1 });
        } else {
            const [, currentLikes] = lines[imageIndex].split(',');
            const newLikes = Math.min(99999, parseInt(currentLikes) + 1); // 添加上限
            lines[imageIndex] = `${imageId},${newLikes}`;
            await writeCsvData(lines);
            res.json({ likes: newLikes });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update likes' });
    }
});

app.delete('/api/likes/:imageId', async (req, res) => {
    try {
        const { imageId } = req.params;

        // 检查操作限制
        if (!isOperationAllowed(imageId, 'unlike')) {
            return res.status(429).json({ error: '操作过于频繁，请稍后再试' });
        }

        const lines = await readCsvData();
        const imageIndex = findImageIndex(lines, imageId);
        
        if (imageIndex !== -1) {
            const [, currentLikes] = lines[imageIndex].split(',');
            const newLikes = Math.max(0, parseInt(currentLikes) - 1);
            lines[imageIndex] = `${imageId},${newLikes}`;
            await writeCsvData(lines);
            res.json({ likes: newLikes });
        } else {
            res.json({ likes: 0 });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update likes' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
