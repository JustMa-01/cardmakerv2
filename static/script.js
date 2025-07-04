document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const imageUpload = document.getElementById('imageUpload');
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const changeImageBtn = document.getElementById('changeImageBtn');
    
    const wishesText = document.getElementById('wishesText');
    const nameText = document.getElementById('nameText');
    const textLines = document.getElementById('textLines');
    
    const wishesFontSizeSlider = document.getElementById('wishesFontSizeSlider');
    const wishesFontSizeValue = document.getElementById('wishesFontSizeValue');
    const nameFontSizeSlider = document.getElementById('nameFontSizeSlider');
    const nameFontSizeValue = document.getElementById('nameFontSizeValue');

    const generateButton = document.getElementById('generateButton');
    const regenerateButton = document.getElementById('regenerateButton');
    const outputContainer = document.getElementById('outputContainer');
    const outputImage = document.getElementById('outputImage');
    const downloadLink = document.getElementById('downloadLink');
    const shareButton = document.getElementById('shareButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const emptyState = document.getElementById('emptyState');

    let currentImageFile = null;

    // Toast notification system
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Update slider value display
    function updateSliderValue(slider, display) {
        const value = slider.value;
        display.textContent = value + '%';
    }

    wishesFontSizeSlider.addEventListener('input', (e) => {
        updateSliderValue(e.target, wishesFontSizeValue);
    });
    
    nameFontSizeSlider.addEventListener('input', (e) => {
        updateSliderValue(e.target, nameFontSizeValue);
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-accent)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-primary)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-primary)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });

    uploadArea.addEventListener('click', () => {
        imageUpload.click();
    });

    // Handle image upload
    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file');
            return;
        }

        currentImageFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            previewContainer.style.display = 'block';
            uploadArea.style.display = 'none';
            resetOutputState();
            showToast('Image uploaded successfully!');
        };
        
        reader.readAsDataURL(file);
    }

    imageUpload.addEventListener('change', (event) => {
        if (event.target.files[0]) {
            handleImageUpload(event.target.files[0]);
        }
    });

    // Change image button
    changeImageBtn.addEventListener('click', () => {
        previewContainer.style.display = 'none';
        uploadArea.style.display = 'block';
        currentImageFile = null;
        resetOutputState();
    });

    // Reset output state
    function resetOutputState() {
        outputContainer.style.display = 'none';
        emptyState.style.display = 'block';
        generateButton.style.display = 'flex';
        regenerateButton.style.display = 'none';
    }

    // Process card request
    function processCardRequest() {
        if (!currentImageFile) {
            showToast('Please upload an image first');
            return;
        }
        
        if (!wishesText.value.trim()) {
            showToast('Please enter some wishes text');
            return;
        }
        
        if (!nameText.value.trim()) {
            showToast('Please enter a recipient name');
            return;
        }

        loadingIndicator.style.display = 'flex';
        emptyState.style.display = 'none';
        outputContainer.style.display = 'none';
        generateButton.disabled = true;
        regenerateButton.disabled = true;

        const formData = new FormData();
        formData.append('image', currentImageFile);
        formData.append('wishes_text', wishesText.value.trim());
        formData.append('name_text', nameText.value.trim());
        formData.append('text_lines', textLines.value);
        formData.append('wishes_font_size_multiplier', parseFloat(wishesFontSizeSlider.value) / 100);
        formData.append('name_font_size_multiplier', parseFloat(nameFontSizeSlider.value) / 100);

        // Use dynamic base URL for local and production
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/process-image`, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || 'Server error');
                }).catch(() => {
                    throw new Error('Image processing failed');
                });
            }
            return response.blob();
        })
        .then(blob => {
            const objectURL = URL.createObjectURL(blob);
            outputImage.src = objectURL;
            
            downloadLink.href = objectURL;
            const safeName = nameText.value.trim().toLowerCase().replace(/\s+/g, '_') || 'custom';
            downloadLink.download = safeName + '_card.jpg';
            
            loadingIndicator.style.display = 'none';
            outputContainer.style.display = 'block';
            
            generateButton.style.display = 'none';
            regenerateButton.style.display = 'flex';
            
            showToast('Card generated successfully!');
        })
        .catch(error => {
            console.error('Processing Error:', error);
            showToast('Failed to create card: ' + error.message);
            
            loadingIndicator.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (regenerateButton.style.display === 'none') {
                generateButton.style.display = 'flex';
            }
        })
        .finally(() => {
            generateButton.disabled = false;
            regenerateButton.disabled = false;
        });
    }

    // Event listeners
    generateButton.addEventListener('click', processCardRequest);
    regenerateButton.addEventListener('click', processCardRequest);

    // Show welcome message
    setTimeout(() => {
        showToast('Welcome to AI Card Creator Pro! 🎉');
    }, 1000);

    // === Dev Crew Modal Logic ===
    const devFooter = document.getElementById('devFooter');
    const devModal = document.getElementById('devModal');
    const devModalClose = document.getElementById('devModalClose');

    // Footer show/hide on scroll to bottom
    function handleFooterVisibility() {
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const bodyHeight = document.body.offsetHeight;
        // If user is at (or very near) the bottom
        if (scrollY + windowHeight >= bodyHeight - 10) {
            devFooter.classList.add('footer-visible');
        } else {
            devFooter.classList.remove('footer-visible');
        }
    }
    window.addEventListener('scroll', handleFooterVisibility);
    window.addEventListener('resize', handleFooterVisibility);
    document.addEventListener('DOMContentLoaded', handleFooterVisibility);

    if (devFooter && devModal && devModalClose) {
        devFooter.addEventListener('click', () => {
            devModal.style.display = 'flex';
        });
        devModalClose.addEventListener('click', () => {
            devModal.style.display = 'none';
        });
        window.addEventListener('click', (event) => {
            if (event.target === devModal) {
                devModal.style.display = 'none';
            }
        });
    }
});