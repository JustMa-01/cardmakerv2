document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let originalImage, subjectImage, imagesLoaded = false;
    let state = {
        fontFamily: 'Anton',
        filename: 'creative-image',
        textLayers: {
            main: { text: 'STYLE', color: '#FFFFFF', x: 0.5, y: 0.5, size: 200, lineMode: 'multi', bbox: {} },
            accent: { text: 'Your', color: '#FFD700', x: 0.5, y: 0.6, size: 80, bbox: {} },
        }
    };
    let selectedLayer = null, isDragging = false, isResizing = false;
    let dragStart = { x: 0, y: 0 };
    
    // --- DOM Cache & Style Presets ---
    let dom = {};
    let ctx;
    const stylePresets = {
        fonts: ['Anton', 'Ash', 'Bebas Neue', 'Bitcount', 'Bungee', 'Caveat', 'Cinzel Decorative', 'Get Show', 'Great Vibes', 'Greek Freak', 'Lobster', 'Rubik Mono One'],
        palettes: [ { main: '#FFFFFF', accent: '#FF3B3B' }, { main: '#000000', accent: '#FFFFFF' }, { main: '#FFFFFF', accent: '#FBBF24' } ],
        layouts: [
            { main: { x: 0.5, y: 0.45, size: 220 }, accent: { x: 0.5, y: 0.55, size: 70 } },
            { main: { x: 0.5, y: 0.5, size: 250 }, accent: { x: 0.5, y: 0.8, size: 60 } },
            { main: { x: 0.25, y: 0.3, size: 180 }, accent: { x: 0.75, y: 0.4, size: 50 } }
        ]
    };

    // --- Server-Side Image Processing ---
    async function handleImageFile(file) {
        if (!file) return;
        resetToInitialState();
        dom.processingOverlay.style.display = 'flex';
        const formData = new FormData();
        formData.append('image', file);
        fetch('/process-image', { method: 'POST', body: formData })
            .then(res => res.ok ? res.json() : Promise.reject('Failed to process image.'))
            .then(data => {
                let loaded = 0;
                const onLoaded = () => {
                    if (++loaded === 2) {
                        imagesLoaded = true;
                        dom.uploadPlaceholder.style.display = 'none';
                        dom.canvas.style.display = 'block';
                        dom.mainHeader.classList.add('visible');
                        dom.processingOverlay.style.display = 'none';
                        regenerateStyles(true);
                    }
                };
                originalImage = Object.assign(new Image(), { src: data.original_image, onload: onLoaded });
                subjectImage = Object.assign(new Image(), { src: data.subject_image, onload: onLoaded });
            })
            .catch(err => { showToast(err.toString(), 'error'); dom.processingOverlay.style.display = 'none'; });
    }
    
    // --- Core Drawing Functions ---
    const drawCanvas = (isExport = false) => {
        if (!imagesLoaded) return;
        ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
        ctx.drawImage(originalImage, 0, 0, dom.canvas.width, dom.canvas.height);
        drawTextBlock(state.textLayers.main);
        ctx.drawImage(subjectImage, 0, 0, dom.canvas.width, dom.canvas.height);
        drawTextBlock(state.textLayers.accent);
        if (selectedLayer && !isExport) drawControls(selectedLayer);
    };

    const drawTextBlock = (layer) => {
        ctx.font = `900 ${layer.size}px '${state.fontFamily}'`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = (layer.lineMode === 'multi' && layer.text.includes(' ')) ? splitText(layer.text) : [layer.text];
        const lineHeight = layer.size * 1.1;
        const totalHeight = (lines.length - 1) * lineHeight;
        const startY = (layer.y * dom.canvas.height) - (totalHeight / 2);
        let maxWidth = 0;
        lines.forEach(line => { if (ctx.measureText(line).width > maxWidth) maxWidth = ctx.measureText(line).width; });
        lines.forEach((line, index) => ctx.fillText(line, layer.x * dom.canvas.width, startY + (index * lineHeight)));
        layer.bbox = { x: (layer.x * dom.canvas.width) - maxWidth / 2, y: startY - lineHeight / 2, width: maxWidth, height: totalHeight + lineHeight };
    };

    const drawControls = (layer) => {
        const bbox = layer.bbox;
        const handleSize = 15;
        const handleX = bbox.x + bbox.width;
        const handleY = bbox.y + bbox.height;
        ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.strokeRect(bbox.x - 10, bbox.y - 10, bbox.width + 20, bbox.height + 20);
        ctx.setLineDash([]); ctx.fillStyle = '#3B82F6'; ctx.beginPath();
        ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
        ctx.fill();
        const touchArea = handleSize * 4;
        layer.bbox.handle = { x: handleX - touchArea / 2, y: handleY - touchArea / 2, size: touchArea };
    };
    
    // --- UI & Controls ---
    const regenerateStyles = (isInitial = false) => {
        if (!imagesLoaded) return showToast("Please upload an image first.");
        const randomFont = stylePresets.fonts[Math.floor(Math.random() * stylePresets.fonts.length)];
        const randomPalette = stylePresets.palettes[Math.floor(Math.random() * stylePresets.palettes.length)];
        const randomLayout = stylePresets.layouts[Math.floor(Math.random() * stylePresets.layouts.length)];
        state.fontFamily = randomFont;
        state.textLayers.main = { ...state.textLayers.main, ...randomLayout.main, color: randomPalette.main };
        state.textLayers.accent = { ...state.textLayers.accent, ...randomLayout.accent, color: randomPalette.accent };
        if (isInitial) setCanvasSize(originalImage);
        else drawCanvas();
        updateAllControls();
    };

    const updateAllControls = () => {
        document.querySelectorAll('.control-font-family .select-selected span').forEach(el => { el.textContent = state.fontFamily; el.style.fontFamily = state.fontFamily; });
        document.querySelectorAll('.control-behind-text').forEach(el => el.value = state.textLayers.main.text);
        document.querySelectorAll('.control-front-text').forEach(el => el.value = state.textLayers.accent.text);
        document.querySelectorAll('.control-behind-size').forEach(el => el.value = state.textLayers.main.size);
        document.querySelectorAll('.control-front-size').forEach(el => el.value = state.textLayers.accent.size);
        document.querySelectorAll('.control-line-mode').forEach(el => el.checked = state.textLayers.main.lineMode === 'multi');
    };
    
    // --- Interaction Logic ---
    const getMousePos = (e) => { const rect = dom.canvas.getBoundingClientRect(); const event = e.touches ? e.touches[0] : e; return { x: (event.clientX - rect.left) * (dom.canvas.width / rect.width), y: (event.clientY - rect.top) * (dom.canvas.height / rect.height) }; };
    const isInsideRect = (pos, rect) => rect && pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
    
    const onInteractionStart = (e) => {
        if (!imagesLoaded) return;
        const pos = getMousePos(e);
        isResizing = false; isDragging = false;
        
        let clickedLayer = isInsideRect(pos, state.textLayers.accent.bbox) ? 'accent' : isInsideRect(pos, state.textLayers.main.bbox) ? 'main' : null;

        if (selectedLayer && selectedLayer.bbox.handle && isInsideRect(pos, selectedLayer.bbox.handle)) {
            isResizing = true;
        } else {
            selectedLayer = clickedLayer ? state.textLayers[clickedLayer] : null;
            isDragging = !!selectedLayer;
        }
        
        if (isDragging || isResizing) { e.preventDefault(); dragStart = pos; dom.canvas.classList.add(isResizing ? 'resizing' : 'grabbing'); }
        drawCanvas();
    };

    const onInteractionMove = (e) => {
        if (!imagesLoaded || (!isDragging && !isResizing)) { const pos = getMousePos(e); dom.canvas.style.cursor = (selectedLayer && selectedLayer.bbox.handle && isInsideRect(pos, selectedLayer.bbox.handle)) ? 'nwse-resize' : 'grab'; return; }
        e.preventDefault();
        const pos = getMousePos(e);
        const dx = pos.x - dragStart.x; const dy = pos.y - dragStart.y;
        if (isResizing) {
            selectedLayer.size += (dx + dy) * 0.5;
            if (selectedLayer.size < 20) selectedLayer.size = 20;
            const sizeSliderClass = selectedLayer === state.textLayers.main ? '.control-behind-size' : '.control-front-size';
            document.querySelectorAll(sizeSliderClass).forEach(s => s.value = selectedLayer.size);
        } else if (isDragging) {
            selectedLayer.x += dx / dom.canvas.width;
            selectedLayer.y += dy / dom.canvas.height;
        }
        dragStart = pos;
        drawCanvas();
    };

    const onInteractionEnd = () => { isDragging = false; isResizing = false; dom.canvas.classList.remove('grabbing', 'resizing'); };

    const setupEventListeners = (container) => {
        const C = cls => container.querySelector(cls);
        const setup = (el, path, event = 'input') => el?.addEventListener(event, () => { let v = el.type === 'checkbox' ? (el.checked ? 'multi' : 'single') : el.type === 'range' ? parseFloat(el.value) : el.value; const k = path.split('.'); let s = state; for (let i = 0; i < k.length - 1; i++) s = s[k[i]]; s[k[k.length - 1]] = v; drawCanvas(); });
        setup(C('.control-behind-text'), 'textLayers.main.text'); setup(C('.control-front-text'), 'textLayers.accent.text');
        setup(C('.control-behind-size'), 'textLayers.main.size'); setup(C('.control-front-size'), 'textLayers.accent.size');
        setup(C('.control-line-mode'), 'textLayers.main.lineMode', 'change');
        C('.control-regenerate-btn')?.addEventListener('click', regenerateStyles);
        
        // ✅ FIXED: Download button logic now works for both desktop and mobile
        const downloadHandler = e => {
            if (!imagesLoaded) { e.preventDefault(); return showToast('Create an image first.'); }
            selectedLayer = null;
            drawCanvas(true);
            const filename = document.querySelector('.control-filename')?.value || 'image';
            e.currentTarget.href = dom.canvas.toDataURL('image/jpeg', 0.95);
            e.currentTarget.download = `${filename}.jpeg`;
            drawCanvas(); // Redraw with controls
        };
        
        (C('.control-download-btn') || dom.downloadBtn).addEventListener('click', downloadHandler);
        
        const fontSelect = C('.control-font-family');
        if (fontSelect) {
            const selected = fontSelect.querySelector('.select-selected');
            const items = fontSelect.querySelector('.select-items');
            if (items.children.length === 0) {
                stylePresets.fonts.forEach(font => {
                    const li = document.createElement('li'); li.textContent = font; li.style.fontFamily = font; li.dataset.value = font; items.appendChild(li);
                });
            }
            selected.addEventListener('click', () => { items.classList.toggle('select-hide'); fontSelect.classList.toggle('active'); });
            items.addEventListener('click', (e) => {
                if(e.target.tagName === 'LI') {
                    state.fontFamily = e.target.dataset.value;
                    selected.querySelector('span').textContent = state.fontFamily;
                    selected.querySelector('span').style.fontFamily = state.fontFamily;
                    items.classList.add('select-hide'); fontSelect.classList.remove('active');
                    drawCanvas();
                }
            });
        }
    };
    
    // --- Init & Helpers ---
    function initApp() {
        // Step 1: Cache all DOM elements
        dom = {
            mainHeader: document.querySelector('.main-header'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            canvas: document.getElementById('previewCanvas'),
            uploadPlaceholder: document.getElementById('uploadPlaceholder'),
            imageUpload: document.getElementById('imageUpload'),
            processingOverlay: document.getElementById('processingOverlay'),
            desktopSidebar: document.getElementById('desktopSidebar'),
            mobileNavButtons: document.querySelectorAll('.mobile-nav__btn'),
            modalBackdrop: document.getElementById('modalBackdrop'),
            modalContent: document.getElementById('modalContent'),
            modalTitle: document.getElementById('modalTitle'),
            modalCloseBtn: document.getElementById('modalCloseBtn'),
            controlTemplates: document.getElementById('control-templates'),
            changeImageBtn: document.getElementById('changeImageBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            toastContainer: document.getElementById('toastContainer'),
            regenerateFab: document.getElementById('regenerateFab')
        };

        if (!dom.canvas) { console.error("FATAL ERROR: Canvas not found."); return; }
        ctx = dom.canvas.getContext('2d');
        
        // Step 2: Setup UI and event listeners
        ['text', 'style', 'export'].forEach(type => { const template = dom.controlTemplates.querySelector(`[data-template="${type}"]`); if (template) dom.desktopSidebar.append(template.cloneNode(true)); });
        setupEventListeners(document.body);
        
        dom.changeImageBtn.addEventListener('click', () => dom.imageUpload.click());
        dom.uploadPlaceholder.addEventListener('click', () => dom.imageUpload.click());
        dom.regenerateFab.addEventListener('click', regenerateStyles);
        dom.imageUpload.addEventListener('change', e => handleImageFile(e.target.files[0]));
        ['dragover', 'drop'].forEach(ev => dom.uploadPlaceholder.addEventListener(ev, e => e.preventDefault()));
        dom.uploadPlaceholder.addEventListener('drop', e => handleImageFile(e.dataTransfer.files[0]));
        
        dom.canvas.addEventListener('mousedown', onInteractionStart); dom.canvas.addEventListener('touchstart', onInteractionStart, { passive: false });
        dom.canvas.addEventListener('mousemove', onInteractionMove); dom.canvas.addEventListener('touchmove', onInteractionMove, { passive: false });
        window.addEventListener('mouseup', onInteractionEnd); window.addEventListener('touchend', onInteractionEnd);
        
        dom.mobileNavButtons.forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.modal)));
        dom.modalCloseBtn.addEventListener('click', () => dom.modalBackdrop.classList.remove('active'));
        document.addEventListener('click', (e) => { 
            const activeSelect = document.querySelector('.custom-select.active');
            if (activeSelect && !activeSelect.contains(e.target)) {
                activeSelect.querySelector('.select-items').classList.add('select-hide');
                activeSelect.classList.remove('active');
            }
        });
    }

    const resetToInitialState = () => { imagesLoaded = false; selectedLayer = null; dom.canvas.style.display = 'none'; dom.uploadPlaceholder.style.display = 'flex'; dom.mainHeader.classList.remove('visible'); };
    const openModal = (type) => { const template = dom.controlTemplates.querySelector(`[data-template="${type}"]`).cloneNode(true); dom.modalContent.innerHTML = ''; dom.modalContent.append(template); dom.modalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Controls`; updateAllControls(); setupEventListeners(dom.modalContent); dom.modalBackdrop.classList.add('active'); };
    const splitText = (text) => { const mid = Math.floor(text.length / 2); const splitPoint = text.lastIndexOf(' ', mid); return splitPoint === -1 ? [text] : [text.substring(0, splitPoint).trim(), text.substring(splitPoint + 1).trim()]; };
    const setCanvasSize = (img) => { const ar = img.naturalWidth / img.naturalHeight; dom.canvas.width = 1080; dom.canvas.height = 1080 / ar; dom.canvasWrapper.style.aspectRatio = ar; drawCanvas(); };
    const showToast = (message) => { const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; dom.toastContainer.appendChild(toast); setTimeout(() => toast.remove(), 3000); };
    
    // --- Start the application ---
    initApp();
});