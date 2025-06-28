# LensStories - 摄影相册展示系统

一个简单优雅的摄影作品展示系统，支持图片预览、全屏浏览、点赞功能等。

## 功能特点

- 响应式瀑布流布局
- 图片懒加载
- 全屏预览模式
- 键盘导航支持（← →方向键、ESC）
- 图片点赞功能
- 点赞数据持久化存储

## 环境要求

- Node.js >= 14.0.0
- 现代浏览器（支持ES6+）

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd LensStories
```

### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 准备图片

在项目根目录下创建以下文件夹结构：

```
LensStories/
├── images/
│   ├── preview/     # 缩略图
│   ├── medium/      # 预览图
│   └── full/        # 原图
```

将你的图片按照以下规则放置：
- preview/: 存放缩略图（建议宽度 400px）
- medium/: 存放预览图（建议宽度 1200px）
- full/: 存放原图

### 4. 配置图片列表

编辑 `config/images.json` 文件：

```json
{
  "imagesList": [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg"
  ]
}
```

### 5. 启动开发服务器

```bash
cd server
npm start
```

访问 http://localhost:3000 即可查看效果

## 本地调试

### 前端调试

- 使用浏览器开发者工具
- 查看控制台输出的日志信息
- 可以修改 css/style.css 实时查看样式变化

### 后端调试

- 检查 server/likes.json 文件查看点赞数据
- 使用 API 测试工具（如 Postman）测试接口：
  - GET /api/likes - 获取所有点赞数据
  - POST /api/likes/:imageId - 增加点赞
  - DELETE /api/likes/:imageId - 取消点赞

## 服务器部署

### 使用 PM2 部署（推荐）

1. 安装 PM2
```bash
npm install -g pm2
```

2. 启动服务
```bash
cd server
pm2 start app.js --name lensstories
```

3. 配置开机自启
```bash
pm2 startup
pm2 save
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/LensStories;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 服务器注意事项

1. 文件权限设置
```bash
chmod 755 /path/to/LensStories
chmod 644 /path/to/LensStories/server/likes.json
```

2. 防火墙配置
```bash
# 开放 HTTP 端口
sudo ufw allow 80
# 如果使用 HTTPS
sudo ufw allow 443
```

## 项目结构

```
LensStories/
├── css/
│   └── style.css
├── js/
│   ├── components/
│   │   └── GalleryView.js
│   └── main.js
├── images/
│   ├── preview/
│   ├── medium/
│   └── full/
├── config/
│   └── images.json
├── server/
│   ├── app.js
│   ├── package.json
│   └── likes.json
└── index.html
```

## 技术栈

- 前端：Vue.js 3、原生 CSS
- 后端：Node.js、Express
- 存储：JSON 文件

## 常见问题

1. 图片无法显示
   - 检查图片路径是否正确
   - 确保图片文件名与 images.json 中的配置一致

2. 点赞功能无响应
   - 确保后端服务正在运行
   - 检查浏览器控制台是否有错误信息
   - 验证 likes.json 文件权限是否正确

3. 服务器部署后无法访问
   - 检查防火墙设置
   - 确认 Nginx 配置是否正确
   - 查看 PM2 日志是否有错误信息

## License

MIT
