const GalleryView = {
    template: `
        <div class="gallery-container">
            <div class="gallery">
                <div v-for="(image, index) in images" 
                     :key="index" 
                     class="gallery-item"
                     @click.stop="openModal(index)">
                    <img :src="image.preview" loading="lazy">
                </div>
            </div>
            
            <template v-if="showModal">
                <div class="modal">
                    <div class="modal-backdrop" @click="closeModal"></div>
                    <button class="nav-btn prev" @click.stop="prevImage" v-show="currentIndex > 0">&lt;</button>
                    <button class="nav-btn next" @click.stop="nextImage" v-show="currentIndex < images.length - 1">&gt;</button>
                    <span class="close" @click.stop="closeModal">&times;</span>
                    <img class="modal-content" 
                         :src="currentImage ? currentImage.medium : ''" 
                         @load="onImageLoad"
                         @click.stop>
                    <div class="loading" v-if="isLoading">加载中...</div>
                    <a :href="currentImage?.full" 
                       class="download-btn" 
                       download
                       @click.stop>下载原图</a>
                </div>
            </template>
        </div>
    `,
    data() {
        return {
            images: [],
            showModal: false,
            currentImage: null,
            currentIndex: 0,
            isLoading: false
        }
    },
    methods: {
        async loadImages() {
            try {
                const response = await fetch('/config/images.json');
                const data = await response.json();
                this.images = data.imagesList.map(filename => ({
                    preview: `images/preview/${filename}`,
                    medium: `images/medium/${filename}`,
                    full: `images/full/${filename}`
                }));
            } catch (error) {
                console.error('Error loading images:', error);
            }
        },

        openModal(index) {
            console.log('Opening modal for index:', index); // 添加调试日志
            this.isLoading = true;
            this.currentIndex = index;
            this.currentImage = this.images[index];
            this.showModal = true;
        },
        
        prevImage() {
            if (this.currentIndex > 0) {
                this.openModal(this.currentIndex - 1);
            }
        },
        
        nextImage() {
            if (this.currentIndex < this.images.length - 1) {
                this.openModal(this.currentIndex + 1);
            }
        },
        
        onImageLoad(event) {
            this.isLoading = false;
            const img = event.target;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 计算图片相对于视口的比例
            const widthRatio = img.naturalWidth / viewportWidth;
            const heightRatio = img.naturalHeight / viewportHeight;
            
            // 如果图片尺寸相对较小，强制使用90%
            if (widthRatio < 0.9 && heightRatio < 0.9) {
                img.style.width = '90vw';
                img.style.height = '90vh';
                img.style.objectFit = 'contain';
            }
        },

        closeModal() {
            this.showModal = false;
            this.currentImage = null;
            this.currentIndex = -1;
        },

        handleKeydown(event) {
            if (!this.showModal) return;
            
            switch(event.key) {
                case 'Escape':
                    this.closeModal();
                    break;
                case 'ArrowLeft':
                    this.prevImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        }
    },
    mounted() {
        this.loadImages();
        document.addEventListener('keydown', this.handleKeydown);
    },
    unmounted() {
        document.removeEventListener('keydown', this.handleKeydown);
    }
}
