# LensStories - Photography Portfolio Display System

A simple and elegant photography portfolio display system with features like image preview, fullscreen browsing, and like functionality.

## Features

- Responsive masonry layout
- Image lazy loading
- Fullscreen preview mode
- Keyboard navigation support (← → arrows, ESC)
- Image like functionality
- Persistent like data storage

## Quick Start

### 1. Clone the Project

```bash
git clone https://github.com/Rui-li023/LensStories.git
cd LensStories
```

### 2. Prepare Images

Place your images in the `images/` directory, install dependencies and run the script. Different pixel configurations are in `config/image-sizes.json`, which can be modified to configure scaling pixels.

```bash
npm install
npm install sharp
npm run update-images
```

The script will automatically scale images and update image data in `config/images.json`

```
LensStories/
├── images/
│   ├── preview/     # Thumbnails
│   ├── medium/      # Preview images
│   └── full/        # Original images
```

### 3. Server Deployment

```bash
cd server
npm install
npm start
```

Visit http://localhost:3000 to view the result
