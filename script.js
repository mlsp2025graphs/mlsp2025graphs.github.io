// Simple JavaScript for Academic Tutorial Website
// Matching the minimal functionality of icml2024graphs.ameyavelingker.com

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close mobile menu with Escape key
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Add CSS for active navigation links
const activeNavStyles = `
    .nav-link.active {
        background-color: #e6f3ff !important;
        color: #0066cc !important;
    }
`;

// Add styles to head
const activeNavStyleSheet = document.createElement('style');
activeNavStyleSheet.textContent = activeNavStyles;
document.head.appendChild(activeNavStyleSheet);

// PDF Navigation and Rendering
let currentPage = 1;
let totalPages = 1;
let pdfDoc = null;
let isRendering = false;

// Configure PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
} else {
    console.warn('PDF.js not loaded at initialization');
}

async function loadPDF(url) {
    try {
        const loadingDiv = document.getElementById('pdfLoading');
        const errorDiv = document.getElementById('pdfError');
        const canvas = document.getElementById('pdfCanvas');
        
        console.log('Starting PDF load...');
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        canvas.style.display = 'none';
        
        // Check if PDF.js is loaded
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            throw new Error('PDF.js not loaded');
        }
        
        console.log('PDF.js is available, loading document:', url);
        
        // Add timeout to the PDF loading
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });
        
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        console.log(`PDF loaded successfully with ${totalPages} pages`);
        
        // Update page count in UI
        const pageCountElement = document.getElementById('pageCount');
        if (pageCountElement) {
            pageCountElement.textContent = totalPages;
        }
        
        // Render first page
        console.log('Rendering first page...');
        await renderPage(1);
        
        loadingDiv.style.display = 'none';
        canvas.style.display = 'block';
        
        console.log('PDF viewer initialized successfully');
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        console.error('Error details:', error.message, error.stack);
        
        const loadingDiv = document.getElementById('pdfLoading');
        const errorDiv = document.getElementById('pdfError');
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (errorDiv) {
            errorDiv.style.display = 'block';
            // Add more detailed error message
            const errorMsg = errorDiv.querySelector('p');
            if (errorMsg) {
                errorMsg.innerHTML = `Unable to display PDF (${error.message}). <a href="${url}" target="_blank">Download the PDF</a> to view the slides.`;
            }
        }
    }
}

async function renderPage(pageNum) {
    if (!pdfDoc || isRendering) {
        console.log('Cannot render page: pdfDoc=', !!pdfDoc, 'isRendering=', isRendering);
        return;
    }
    
    isRendering = true;
    console.log(`Rendering page ${pageNum}...`);
    
    try {
        const page = await pdfDoc.getPage(pageNum);
        console.log('Page loaded successfully');
        
        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx) {
            throw new Error('Canvas or context not available');
        }
        
        // Calculate scale to fit within container while maintaining aspect ratio
        const container = document.getElementById('pdfContainer');
        const containerWidth = Math.max(400, container.offsetWidth - 40); // Account for padding
        const containerHeight = 700; // Increased height for better aspect ratio
        
        const viewport = page.getViewport({ scale: 1 });
        
        // Calculate scale based on container dimensions, maintaining aspect ratio
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        let scale = Math.min(scaleX, scaleY);
        
        // Limit scale for reasonable sizes and quality
        scale = Math.min(scale, 2.5); // Maximum scale for quality
        scale = Math.max(scale, 0.5); // Minimum scale to ensure readability
        
        // For high-DPI displays, we'll handle this in the canvas rendering
        console.log(`Original viewport: ${viewport.width}x${viewport.height}`);
        console.log(`Container: ${containerWidth}x${containerHeight}`);
        console.log(`Calculated scale: ${scale}`);
        
        console.log(`Viewport: ${viewport.width}x${viewport.height}, Scale: ${scale}`);
        
        const scaledViewport = page.getViewport({ scale: scale });
        
        // Set canvas size for crisp rendering on high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(scaledViewport.width);
        const displayHeight = Math.floor(scaledViewport.height);
        
        // Set actual canvas size in memory (scaled up for high-DPI)
        canvas.width = displayWidth * pixelRatio;
        canvas.height = displayHeight * pixelRatio;
        
        // Scale the canvas back down using CSS
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";
        
        // Scale the drawing context so everything draws at high-DPI
        ctx.scale(pixelRatio, pixelRatio);
        
        console.log(`Display size: ${displayWidth}x${displayHeight}`);
        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
        console.log(`Pixel ratio: ${pixelRatio}`);
        
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };
        
        console.log('Starting page render...');
        await page.render(renderContext).promise;
        console.log(`Page ${pageNum} rendered successfully`);
        
        currentPage = pageNum;
        updateNavigationState();
        
    } catch (error) {
        console.error('Error rendering page:', error);
        console.error('Error details:', error.message, error.stack);
    } finally {
        isRendering = false;
    }
}

function updateNavigationState() {
    const pageInputElement = document.getElementById('pageInput');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (pageInputElement) {
        pageInputElement.value = currentPage;
        pageInputElement.max = totalPages;
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }
}

function goToPage(pageNum) {
    const targetPage = Math.max(1, Math.min(pageNum, totalPages));
    if (targetPage !== currentPage && !isRendering) {
        renderPage(targetPage);
    }
}

function setupFallbackViewer() {
    const fallbackBtn = document.getElementById('fallbackBtn');
    const iframe = document.getElementById('pdfFallback');
    const canvas = document.getElementById('pdfCanvas');
    const errorDiv = document.getElementById('pdfError');
    
    if (fallbackBtn && iframe) {
        fallbackBtn.addEventListener('click', function() {
            console.log('Switching to fallback iframe viewer');
            canvas.style.display = 'none';
            errorDiv.style.display = 'none';
            iframe.src = 'assets/MLSP GNN Tutorial (PDF compatible).pdf#page=' + currentPage;
            iframe.style.display = 'block';
            
            // Update navigation to work with iframe
            const prevBtn = document.getElementById('prevPage');
            const nextBtn = document.getElementById('nextPage');
            const pageInput = document.getElementById('pageInput');
            
            if (prevBtn && nextBtn) {
                prevBtn.onclick = function() {
                    if (currentPage > 1) {
                        currentPage--;
                        iframe.src = 'assets/MLSP GNN Tutorial (PDF compatible).pdf#page=' + currentPage;
                        updateNavigationState();
                    }
                };
                
                nextBtn.onclick = function() {
                    if (currentPage < totalPages) {
                        currentPage++;
                        iframe.src = 'assets/MLSP GNN Tutorial (PDF compatible).pdf#page=' + currentPage;
                        updateNavigationState();
                    }
                };
                
                // Update page input for iframe mode
                if (pageInput) {
                    pageInput.onchange = function() {
                        const targetPage = parseInt(this.value);
                        if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
                            currentPage = targetPage;
                            iframe.src = 'assets/MLSP GNN Tutorial (PDF compatible).pdf#page=' + currentPage;
                            updateNavigationState();
                        } else {
                            this.value = currentPage;
                        }
                    };
                }
            }
        });
    }
}

// Initialize PDF viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing PDF viewer...');
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInput = document.getElementById('pageInput');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', function() {
            goToPage(currentPage - 1);
        });
        
        nextBtn.addEventListener('click', function() {
            goToPage(currentPage + 1);
        });
        
        // Add page input functionality
        if (pageInput) {
            pageInput.addEventListener('change', function() {
                const targetPage = parseInt(this.value);
                if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
                    goToPage(targetPage);
                } else {
                    // Reset to current page if invalid input
                    this.value = currentPage;
                }
            });
            
            pageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    this.blur(); // Trigger change event
                }
            });
        }
        
        // Setup fallback viewer
        setupFallbackViewer();
        
        // Try to load PDF immediately, with fallback
        console.log('Attempting to load PDF...');
        console.log('PDF.js available:', typeof pdfjsLib !== 'undefined');
        
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js not loaded, using iframe fallback immediately');
            totalPages = 216; // Set default page count
            const pageCountElement = document.getElementById('pageCount');
            if (pageCountElement) {
                pageCountElement.textContent = totalPages;
            }
            
            setTimeout(() => {
                const errorDiv = document.getElementById('pdfError');
                const loadingDiv = document.getElementById('pdfLoading');
                const fallbackBtn = document.getElementById('fallbackBtn');
                
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'block';
                if (fallbackBtn) fallbackBtn.click(); // Auto-click fallback
            }, 500);
        } else {
            // Set a timeout for PDF loading
            const loadingTimeout = setTimeout(() => {
                console.warn('PDF loading taking too long, showing fallback option');
                const errorDiv = document.getElementById('pdfError');
                const loadingDiv = document.getElementById('pdfLoading');
                
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    const errorMsg = errorDiv.querySelector('p');
                    if (errorMsg) {
                        errorMsg.innerHTML = 'PDF loading is taking longer than expected. <a href="assets/MLSP GNN Tutorial (PDF compatible).pdf" target="_blank">Download the PDF</a> or try the alternative viewer below.';
                    }
                }
            }, 10000); // 10 second timeout
            
            try {
                await loadPDF('assets/MLSP GNN Tutorial (PDF compatible).pdf');
                clearTimeout(loadingTimeout);
            } catch (error) {
                clearTimeout(loadingTimeout);
                console.error('Failed to load PDF:', error);
            }
        }
    }
}); 