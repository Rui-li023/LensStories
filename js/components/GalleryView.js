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
                    <img src="/assets/icons/close.svg" class="close" @click.stop="closeModal">
                    <img class="modal-content" 
                         :src="currentImage ? currentImage.medium : ''" 
                         @load="onImageLoad"
                         @click.stop>
                    <div class="loading" v-if="isLoading">Loading...</div>
                    <a :href="currentImage?.full" 
                       class="download-btn" 
                       download
                       @click.stop>Download</a>
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
            globalLikes: {},
            isLoadingBatch: false,
            currentBatchIndex: 0,
            allImagesList: [],
            batchSize: 15,
            loadingInterval: 2000
        }
    },
    methods: {
        async loadImages() {
            try {
                const response = await fetch('/config/images.json');
                const data = await response.json();
                this.allImagesList = data.imagesList;
                
                this.loadNextBatch();
            } catch (error) {
                console.error('Error loading images.json:', error);
            }
        },

        async loadNextBatch() {
            if (this.isLoadingBatch || this.currentBatchIndex >= this.allImagesList.length) {
                return;
            }

            this.isLoadingBatch = true;
            const batch = this.allImagesList.slice(
                this.currentBatchIndex,
                this.currentBatchIndex + this.batchSize
            );

            for (const filename of batch) {
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
                    
                    this.images.push(imageData);
                    
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

            this.currentBatchIndex += this.batchSize;
            this.isLoadingBatch = false;

            if (this.currentBatchIndex < this.allImagesList.length) {
                setTimeout(() => this.loadNextBatch(), this.loadingInterval);
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
            console.log('Opening modal for index:', index);
            this.isLoading = true;
            this.currentIndex = index;
            this.currentImage = this.images[index];
            this.showModal = true;

            this.$nextTick(() => {
                const modalImage = document.querySelector('.modal-content');
                if (modalImage) {
                    modalImage.style.animation = 'none';
                    modalImage.offsetHeight;
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
            
            const widthRatio = img.naturalWidth / viewportWidth;
            const heightRatio = img.naturalHeight / viewportHeight;
            
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
            if (event.key === 'Escape' && this.showModal) {
                event.preventDefault();
                this.closeModal();
                return;
            }
            
            if (!this.showModal) return;
            
            switch(event.key) {
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
                
                localStorage.setItem('likedImages', JSON.stringify(this.likedImages));
                
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

        window.addEventListener('scroll', () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bodyHeight = document.body.offsetHeight;
            
            if (scrollPosition >= bodyHeight - 1000) {
                this.loadNextBatch();
            }
        });
    },
    unmounted() {
        document.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('scroll', this.loadNextBatch);
    }
}
