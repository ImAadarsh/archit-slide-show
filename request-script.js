// Global variables
let TrendingSlider;
const BASE_URL = 'https://api.invoicemate.in';
const IMAGE_BASE_URL = 'https://api.invoicemate.in/storage/app/';
let allProducts = [];

// Get URL parameters
function getUrlParameters() {
    const url = window.location.search;
    const params = url.substring(1);
    
    if (!params) {
        console.error('No URL parameters found');
        return null;
    }
    
    const ids = params.split('-');
    
    if (ids.length < 2) {
        console.error('Invalid URL parameters. Expected format: ?6-94-89-87');
        return null;
    }
    
    return {
        businessId: ids[0],
        productIds: ids.slice(1)
    };
}

// Fetch business details
async function fetchBusinessDetails(businessId) {
    try {
        const response = await fetch(`${BASE_URL}/public/api/business/${businessId}`);
        const data = await response.json();
        if (data.status) return data.data;
        throw new Error('Failed to fetch business details');
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Fetch product details
async function fetchProductDetails(productId, expectedBusinessId) {
    try {
        const response = await fetch(`${BASE_URL}/public/api/products/${productId}`);
        const data = await response.json();
        
        if (data.status) {
            const product = data.data;
            if (product.business_id != expectedBusinessId) return null;
            return product;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

// Create product slide for original images
function createProductSlides(product, productIndex) {
    const slides = [];
    if (product.images && product.images.length > 0) {
        // Filter for ORIGINAL images (is_mockup === 0)
        const originalImages = product.images.filter(image => image.is_mockup === 0);
        
        originalImages.forEach((image, imgIndex) => {
            const imageUrl = IMAGE_BASE_URL + image.image;
            const counterLabel = originalImages.length > 1 ? ` (Photo ${imgIndex + 1}/${originalImages.length})` : '';
            slides.push(`
                <div class="swiper-slide trending-slide">
                    <div class="swiper-zoom-container">
                        <div class="item-identifier">Item #${productIndex + 1}${counterLabel}</div>
                        <img 
                            src="${imageUrl}" 
                            alt="Product Image" 
                            class="swiper-lazy"
                            onerror="this.closest('.swiper-slide').style.display='none'">
                        <div class="swiper-lazy-preloader"></div>
                    </div>
                </div>
            `);
        });
    }
    return slides;
}

// Initialize slider
function initializeSlider() {
    TrendingSlider = new Swiper('.trending-slider', {
        effect: 'slide',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        slidesPerView: 'auto',
        spaceBetween: 30,
        zoom: {
            maxRatio: 3,
            minRatio: 1,
            toggle: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
        },
        lazy: true,
    });
}

// Render products
async function renderProducts() {
    const container = document.getElementById('products-container');
    const allSlides = [];
    
    allProducts.forEach((product, index) => {
        const slides = createProductSlides(product, index);
        allSlides.push(...slides);
    });
    
    if (allSlides.length === 0) {
        container.innerHTML = '<p class="error-message">No original images found for selected products.</p>';
        return;
    }
    
    container.innerHTML = allSlides.join('');
    initializeSlider();
}

// Main init function
async function init() {
    const params = getUrlParameters();
    if (!params) return;
    
    const business = await fetchBusinessDetails(params.businessId);
    if (business) {
        document.getElementById('business-name').textContent = business.business_name;
    }
    
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Fetch all products
    const productPromises = params.productIds.map(id => fetchProductDetails(id, params.businessId));
    const products = await Promise.all(productPromises);
    allProducts = products.filter(p => p !== null);
    
    await renderProducts();
}

window.addEventListener('DOMContentLoaded', init);
