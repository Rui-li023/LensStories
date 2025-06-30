const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());
app.use(express.static('../'));

const LIKES_FILE = path.join(__dirname, 'likes.csv');

async function ensureLikesFile() {
    try {
        await fs.access(LIKES_FILE);
    } catch {
        await fs.writeFile(LIKES_FILE, 'imageId,likes\n');
    }
}

async function readCsvData() {
    await ensureLikesFile();
    const data = await fs.readFile(LIKES_FILE, 'utf8');
    return data.trim().split('\n');
}

async function writeCsvData(lines) {
    await fs.writeFile(LIKES_FILE, lines.join('\n'));
}

function findImageIndex(lines, imageId) {
    return lines.findIndex((line, index) => 
        index > 0 && line.startsWith(imageId + ',')
    );
}

const OPERATION_COOLDOWN = 1000;
const operationCache = new Map();

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
        
        if (!isOperationAllowed(imageId, 'like')) {
            return res.status(429).json({ error: 'Please wait before trying again!' });
        }

        const lines = await readCsvData();
        const imageIndex = findImageIndex(lines, imageId);
        
        if (imageIndex === -1) {
            lines.push(`${imageId},1`);
            await writeCsvData(lines);
            res.json({ likes: 1 });
        } else {
            const [, currentLikes] = lines[imageIndex].split(',');
            const newLikes = Math.min(99999, parseInt(currentLikes) + 1);
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

        if (!isOperationAllowed(imageId, 'unlike')) {
            return res.status(429).json({ error: 'Please wait before trying again!' });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
