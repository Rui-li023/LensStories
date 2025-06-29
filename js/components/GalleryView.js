const GalleryView = {
    template: `
        <div class="gallery-container">
            <div class="gallery">
                <div v-for="(image, index) in images" 
                     :key="index" 
                     class="gallery-item"
                     @click.stop="openModal(index)">
                    <img :src="image.preview" loading="lazy">
                    <div class="like-button" @click.stop="toggleLike(index)">
                        <span :class="['heart', { 'liked': isLiked(index) }]">♥</span>
                        <span class="like-count" v-if="getLikeCount(index)">{{getLikeCount(index)}}</span>
                    </div>
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
                    <div class="loading" v-if="isLoading">Loading...</div>
                    <a :href="currentImage?.full" 
                       class="download-btn" 
                       download
                       @click.stop>下载原图</a>
                    <div class="modal-like-button" @click.stop="toggleLike(currentIndex)">
                        <span :class="['heart', { 'liked': isLiked(currentIndex) }]">♥</span>
                        <span class="like-count" v-if="getLikeCount(currentIndex)">{{getLikeCount(currentIndex)}}</span>
                    </div>
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
            isLoading: false,
            likedImages: JSON.parse(localStorage.getItem('likedImages') || '{}'),
            globalLikes: {}
        }
    },
    methods: {
        async loadImages() {
            try {
                const response = await fetch('/config/images.json');
                const data = await response.json();
                
                // 逐个加载图片
                const loadedImages = [];
                for (const filename of data.imagesList) {
                    try {
                        const img = new Image();
                        const loadPromise = new Promise((resolve, reject) => {
                            img.onload = () => resolve(img);
                            img.onerror = () => reject(new Error(`Failed to load ${filename}`));
                        });
                        
                        img.src = `images/preview/${filename}`;
                        const loadedImg = await loadPromise;
                        
                        const imageData = {
                            preview: `images/preview/${filename}`,
                            medium: `images/medium/${filename}`,
                            full: `images/full/${filename}`,
                            width: loadedImg.naturalWidth,
                            height: loadedImg.naturalHeight,
                            aspectRatio: loadedImg.naturalWidth / loadedImg.naturalHeight
                        };
                        
                        loadedImages.push(imageData);
                        // 立即更新显示已加载的图片
                        this.images = [...loadedImages];
                        
                        // 计算新加载图片的flex-basis
                        this.$nextTick(() => {
                            const items = document.querySelectorAll('.gallery-item');
                            const lastItem = items[items.length - 1];
                            if (lastItem) {
                                const flexBasis = (400 * imageData.aspectRatio) + 'px';
                                lastItem.style.flexBasis = flexBasis;
                            }
                        });
                    } catch (error) {
                        console.warn(`Skipping image ${filename}:`, error);
                        continue;
                    }
                }
            } catch (error) {
                console.error('Error loading images.json:', error);
            }
        },

        async loadGlobalLikes() {
            try {
                const response = await fetch('api/likes');
                this.globalLikes = await response.json();
            } catch (error) {
                console.error('Error loading likes:', error);
            }
        },

        openModal(index) {
            console.log('Opening modal for index:', index); // 添加调试日志
            this.isLoading = true;
            this.currentIndex = index;
            this.currentImage = this.images[index];
            this.showModal = true;

            // 重置动画
            this.$nextTick(() => {
                const modalImage = document.querySelector('.modal-content');
                if (modalImage) {
                    modalImage.style.animation = 'none';
                    modalImage.offsetHeight; // 触发重排
                    modalImage.style.animation = null;
                }
            });
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
        },

        async toggleLike(index) {
            const imageId = this.images[index].preview;
            const wasLiked = this.likedImages[imageId];
            
            try {
                // 更新个人点赞状态
                if (wasLiked) {
                    delete this.likedImages[imageId];
                    await fetch(`api/likes/${encodeURIComponent(imageId)}`, {
                        method: 'DELETE'
                    });
                } else {
                    this.likedImages[imageId] = true;
                    await fetch(`api/likes/${encodeURIComponent(imageId)}`, {
                        method: 'POST'
                    });
                }
                
                // 保存个人点赞状态
                localStorage.setItem('likedImages', JSON.stringify(this.likedImages));
                
                // 重新加载全局点赞数
                await this.loadGlobalLikes();
                
            } catch (error) {
                console.error('Error updating likes:', error);
            }
        },
        
        getLikeCount(index) {
            if (!this.images[index]) return 0;
            const imageId = this.images[index].preview;
            return this.globalLikes[imageId] || 0;
        },
        
        isLiked(index) {
            if (!this.images[index]) return false;
            const imageId = this.images[index].preview;
            return Boolean(this.likedImages[imageId]);
        }
    },
    async mounted() {
        await this.loadImages();
        await this.loadGlobalLikes();
        document.addEventListener('keydown', this.handleKeydown);
    },
    unmounted() {
        document.removeEventListener('keydown', this.handleKeydown);
    }
}
