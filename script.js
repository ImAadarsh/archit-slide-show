// Global variables
let TrendingSlider;
let currentBusiness = null;
let allProducts = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentSliderIsMobile = window.innerWidth <= 768;
const BASE_URL = 'https://api.invoicemate.in';
const IMAGE_BASE_URL = 'https://api.invoicemate.in/storage/app/';

// Get URL parameters
function getUrlParameters() {
    const url = window.location.search;
    console.log('URL:', url);
    
    // Remove the '?' and split by '-'
    const params = url.substring(1); // Remove '?'
    console.log('Params:', params);
    
    if (!params) {
        console.error('No URL parameters found');
        return null;
    }
    
    const ids = params.split('-');
    console.log('IDs:', ids);
    
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
        
        if (data.status) {
            const business = data.data;
            
            // Check if business is active
            if (!business.is_active) {
                console.error('Business is not active:', business.business_name);
                return { ...business, is_active: false }; // Return business data but mark as inactive
            }
            
            return business;
        } else {
            throw new Error('Failed to fetch business details');
        }
    } catch (error) {
        console.error('Error fetching business details:', error);
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
            
            // Verify product belongs to the correct business
            if (product.business_id != expectedBusinessId) {
                console.warn(`Product ${productId} does not belong to business ${expectedBusinessId}`);
                return null;
            }
            
            return product;
        } else {
            throw new Error(`Failed to fetch product ${productId}`);
        }
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

// current-year
const currentYear = new Date().getFullYear();
document.getElementById('current-year').textContent = currentYear;

// Update meta tags with business information
function updateMetaTags(business) {
    const businessName = business.business_name || 'Art Gallery';
    const businessDescription = `${businessName} - Premium Art Gallery Collection featuring unique artworks from talented artists. Discover beautiful paintings, sculptures, and contemporary art pieces.`;
    const currentUrl = window.location.href;
    const logoUrl = business.logo ? IMAGE_BASE_URL + business.logo : '';
    
    // Update basic meta tags
    document.title = `${businessName} - Art Gallery Collection`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', businessDescription);
    }
    
    // Update keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        metaKeywords.setAttribute('content', `${businessName.toLowerCase()}, art gallery, paintings, artwork, artists, fine art, contemporary art, ${businessName}`);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', `${businessName} - Art Gallery Collection`);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        ogDescription.setAttribute('content', businessDescription);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', currentUrl);
    }
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && logoUrl) {
        ogImage.setAttribute('content', logoUrl);
    }
    
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
        ogSiteName.setAttribute('content', businessName);
    }
    
    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
        twitterTitle.setAttribute('content', `${businessName} - Art Gallery Collection`);
    }
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
        twitterDescription.setAttribute('content', businessDescription);
    }
    
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && logoUrl) {
        twitterImage.setAttribute('content', logoUrl);
    }
    
    // Update favicon and app icons
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && logoUrl) {
        favicon.setAttribute('href', logoUrl);
    }
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon && logoUrl) {
        appleTouchIcon.setAttribute('href', logoUrl);
    }
    
    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
        canonicalLink.setAttribute('href', currentUrl);
    }
    
    // Update application name
    const appName = document.querySelector('meta[name="application-name"]');
    if (appName) {
        appName.setAttribute('content', businessName);
    }
    
    console.log('Meta tags updated for:', businessName);
}

// Update business information
function updateBusinessInfo(business) {
    console.log('Updating business info:', business);
    currentBusiness = business;
    
    const businessLogo = document.getElementById('business-logo');
    const businessName = document.getElementById('business-name');
    
    if (business.logo) {
        const logoUrl = IMAGE_BASE_URL + business.logo;
        console.log('Logo URL:', logoUrl);
        businessLogo.src = logoUrl;
        businessLogo.style.display = 'block';
        
        // Handle logo load error
        businessLogo.onerror = function() {
            console.log('Logo failed to load, hiding logo');
            this.style.display = 'none';
        };
    } else {
        console.log('No logo found, hiding logo element');
        businessLogo.style.display = 'none';
    }
    
    businessName.textContent = business.business_name || 'Art Gallery';
    
    // Update meta tags with business information
    updateMetaTags(business);
}

// Placeholder SVG (inline, never fails to load)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"%3E%3Crect fill="%23f0f0f0" width="400" height="500"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="250" dx="50" text-anchor="start"%3EImage Not Available%3C/text%3E%3Ccircle cx="200" cy="200" r="60" fill="%23ddd"/%3E%3Cpath d="M200 160 L200 240 M160 200 L240 200" stroke="%23999" stroke-width="8" stroke-linecap="round"/%3E%3C/svg%3E';

// Validate if image URL is accessible
function validateImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
}

// Validate product has loadable mockup images
async function validateProduct(product) {
    if (!product.images || product.images.length === 0) {
        console.log(`Product ${product.id} has no images, skipping`);
        return false;
    }
    
    // Filter to show only mockup images (is_mockup === 1)
    const mockupImages = product.images.filter(image => image.is_mockup === 1);
    
    if (mockupImages.length === 0) {
        console.log(`Product ${product.id} has no mockup images, skipping`);
        return false;
    }
    
    // Check if at least the first mockup image loads
    const firstImageUrl = IMAGE_BASE_URL + mockupImages[0].image;
    const isValid = await validateImageUrl(firstImageUrl);
    
    if (!isValid) {
        console.log(`Product ${product.id} first mockup image failed to load, skipping`);
    }
    
    return isValid;
}

// Create product slide HTML for a single image
function createProductSlideWithImage(product, imageUrl, imageIndex = 0, totalImages = 1) {
    const size = `${product.width} × ${product.height}`;
    const price = product.is_include_gst ? `₹${product.price} (Inc. GST)` : `₹${product.price}`;
    const isInWishlist = wishlist.some(item => item.productId === product.id);
    
    // Show image counter if there are multiple mockup images
    const imageCounter = totalImages > 1 ? `<div class="image-counter">1/${totalImages}</div>` : '';
    
    return `
        <div class="swiper-slide trending-slide" data-product-id="${product.id}" data-image-index="0">
            <div class="trending-slide-img">
                <div class="image-overlay"></div>
                <img 
                    data-src="${imageUrl}" 
                    alt="${product.name}" 
                    class="swiper-lazy"
                    onerror="this.closest('.swiper-slide').style.display='none'">
                <div class="swiper-lazy-preloader"></div>
                ${imageCounter}
                <button class="quick-view-btn" onclick="openProductModal(${product.id}, 0)">
                    <ion-icon name="eye-outline"></ion-icon>
                </button>
                <button class="wishlist-btn-slide ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                    <ion-icon name="${isInWishlist ? 'heart' : 'heart-outline'}"></ion-icon>
                </button>
            </div>
            <div class="trending-slide-content">
                <h1 class="product-price">${price}</h1>
                <div class="trending-slide-content-bottom">
                    <h2 class="product-name">${product.name}</h2>
                    <h3 class="product-artist">Artist: ${product.artist_name}</h3>
                    <h4 class="product-size">Size: ${size}</h4>
                    <h5 class="product-category">${product.category?.name || ''}</h5>
                </div>
            </div>
        </div>
    `;
}

// Create one slide per product (showing first mockup image)
function createProductSlides(product) {
    const slides = [];
    
    if (product.images && product.images.length > 0) {
        // Filter to show only mockup images (is_mockup === 1)
        const mockupImages = product.images.filter(image => image.is_mockup === 1);
        
        if (mockupImages.length > 0) {
            // Create only ONE slide per product using the first mockup image
            const imageUrl = IMAGE_BASE_URL + mockupImages[0].image;
            slides.push(createProductSlideWithImage(product, imageUrl, 0, mockupImages.length));
        }
        // Don't create slides for products without mockup images
    }
    
    return slides;
}

// Initialize slider with simple horizontal scroll
function initializeSlider() {
    // Detect if device is mobile
    const isMobile = window.innerWidth <= 768;
    
    TrendingSlider = new Swiper('.trending-slider', {
        // Simple slide effect (no 3D)
        effect: 'slide',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        
        // Responsive slides per view
        slidesPerView: isMobile ? 1 : 'auto',
        spaceBetween: isMobile ? 0 : 30,
        
        // Smooth, fast transitions
        speed: isMobile ? 400 : 600,
        
        // Autoplay
        autoplay: false,
        
        // Navigation
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        
        // Lazy loading for performance
        lazy: {
            loadPrevNext: true,
            loadPrevNextAmount: 2,
        },
        preloadImages: false,
        watchSlidesProgress: true,
        
        // Smooth touch handling
        touchRatio: 1,
        threshold: 5,
        longSwipes: true,
        longSwipesRatio: 0.5,
        
        // Prevent accidental clicks
        preventClicks: false,
        preventClicksPropagation: false,
        
        // Smooth momentum
        freeMode: false,
        freeModeSticky: false,
        
        // Better for mobile
        resistance: true,
        resistanceRatio: 0.85,
        
        // Add slight scaling for visual interest (optional)
        slideToClickedSlide: true,
    });
    
    currentSliderIsMobile = isMobile;
    
    // Optimize autoplay for mobile (pause when not visible)
    if (isMobile && TrendingSlider.params.autoplay && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    TrendingSlider.autoplay.start();
                } else {
                    TrendingSlider.autoplay.stop();
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(document.querySelector('.trending-slider'));
    }
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeWishlist();
        }
        if (e.key === 'ArrowLeft' && TrendingSlider) {
            TrendingSlider.slidePrev();
        }
        if (e.key === 'ArrowRight' && TrendingSlider) {
            TrendingSlider.slideNext();
        }
    });
}

// Handle window resize with debounce for better performance
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (TrendingSlider) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile !== currentSliderIsMobile) {
                TrendingSlider.destroy(true, true);
                initializeSlider();
            } else {
                TrendingSlider.update();
            }
        }
    }, 250);
});

// Render products (only those with valid mockup images)
async function renderProducts() {
    const container = document.getElementById('products-container');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Validating images...</p>
        </div>
    `;
    
    // Validate all products and filter out those with broken images
    const validationResults = await Promise.all(
        allProducts.map(async (product) => ({
            product,
            isValid: await validateProduct(product)
        }))
    );
    
    // Keep only products with valid images
    const validProducts = validationResults
        .filter(result => result.isValid)
        .map(result => result.product);
    
    console.log(`Total products: ${allProducts.length}, Valid products: ${validProducts.length}`);
    
    if (validProducts.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <ion-icon name="images-outline"></ion-icon>
                <p>No products with valid images available at the moment.</p>
            </div>
        `;
        return;
    }
    
    // Create slides only for valid products
    const allSlides = [];
    validProducts.forEach(product => {
        const productSlides = createProductSlides(product);
        allSlides.push(...productSlides);
    });
    
    container.innerHTML = allSlides.join('');
    
    if (TrendingSlider) {
        TrendingSlider.destroy(true, true);
    }
    initializeSlider();
}

// Wishlist functionality
function toggleWishlist(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = wishlist.findIndex(item => item.productId === productId);
    
    if (existingIndex > -1) {
        // Remove from wishlist
        wishlist.splice(existingIndex, 1);
    } else {
        // Add to wishlist
        wishlist.push({
            productId: productId,
            name: product.name,
            artist: product.artist_name,
            price: product.price,
            image: product.images?.[0]?.image || null
        });
    }
    
    // Save to localStorage
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update UI
    updateWishlistUI();
    renderProducts(); // Re-render to update wishlist buttons
}

// Update wishlist UI
function updateWishlistUI() {
    const wishlistCount = document.getElementById('wishlist-count');
    const wishlistItems = document.getElementById('wishlist-items');
    const wishlistEmpty = document.getElementById('wishlist-empty');
    const wishlistActions = document.getElementById('wishlist-actions');
    
    wishlistCount.textContent = wishlist.length;
    
    if (wishlist.length === 0) {
        wishlistItems.style.display = 'none';
        wishlistActions.style.display = 'none';
        wishlistEmpty.style.display = 'flex';
    } else {
        wishlistItems.style.display = 'block';
        wishlistActions.style.display = 'block';
        wishlistEmpty.style.display = 'none';
        
        wishlistItems.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <img src="${item.image ? IMAGE_BASE_URL + item.image : PLACEHOLDER_IMAGE}" 
                     alt="${item.name}"
                     onerror="this.closest('.wishlist-item').style.opacity='0.5'">
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <button class="remove-wishlist" onclick="removeFromWishlist(${item.productId})">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `).join('');
    }
}

// Remove from wishlist
function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.productId !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
    renderProducts();
}

// Modal functionality
function openProductModal(productId, imageIndex = 0) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('product-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalMainImage = document.getElementById('modal-main-image');
    const modalArtist = document.getElementById('modal-artist');
    const modalSize = document.getElementById('modal-size');
    const modalCategory = document.getElementById('modal-category');
    const modalPrice = document.getElementById('modal-price');
    const modalGstInfo = document.getElementById('modal-gst-info');
    const modalWishlistBtn = document.getElementById('modal-wishlist-btn');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');

    modal.dataset.productId = productId;
    
    // Set product details
    modalProductName.textContent = product.name;
    modalArtist.textContent = `Artist: ${product.artist_name}`;
    modalSize.textContent = `Size: ${product.width} × ${product.height}`;
    modalCategory.textContent = `Category: ${product.category?.name || 'N/A'}`;
    modalPrice.textContent = `₹${product.price}`;
    modalGstInfo.textContent = product.is_include_gst ? 'Including GST' : 'Excluding GST';
    
    // Set wishlist button state
    const isInWishlist = wishlist.some(item => item.productId === productId);
    modalWishlistBtn.className = `wishlist-btn-modal ${isInWishlist ? 'active' : ''}`;
    modalWishlistBtn.innerHTML = `
        <ion-icon name="${isInWishlist ? 'heart' : 'heart-outline'}"></ion-icon>
        ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    `;
    
    // Set images - filter to show only mockup images (is_mockup === 1)
    if (product.images && product.images.length > 0) {
        const mockupImages = product.images.filter(image => image.is_mockup === 1);
        
        if (mockupImages.length > 0) {
            // Ensure imageIndex is within bounds
            const validImageIndex = Math.min(imageIndex, mockupImages.length - 1);
            modalMainImage.src = IMAGE_BASE_URL + mockupImages[validImageIndex].image;
            
            // If main image fails to load, close modal
            modalMainImage.onerror = function() { 
                console.error('Main image failed to load, closing modal');
                closeModal();
                alert('Unable to load product images. Please try again later.');
            };
            
            // Create thumbnails for mockup images only
            thumbnailGallery.innerHTML = mockupImages.map((image, index) => `
                <img src="${IMAGE_BASE_URL + image.image}" 
                     alt="Thumbnail ${index + 1}" 
                     class="thumbnail ${index === validImageIndex ? 'active' : ''}"
                     onerror="this.style.display='none'"
                     onclick="changeModalImage('${IMAGE_BASE_URL + image.image}', ${index})">
            `).join('');
        } else {
            closeModal();
            alert('This product has no images available.');
        }
    } else {
        closeModal();
        alert('This product has no images available.');
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Change modal image
function changeModalImage(imageUrl, index) {
    const modalMainImage = document.getElementById('modal-main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    modalMainImage.src = imageUrl;
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Close modal
function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Wishlist sidebar
function toggleWishlistSidebar() {
    const sidebar = document.getElementById('wishlist-sidebar');
    sidebar.classList.toggle('open');
}

function closeWishlist() {
    const sidebar = document.getElementById('wishlist-sidebar');
    sidebar.classList.remove('open');
}

// Share functionality
function shareProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const businessName = currentBusiness?.business_name || 'Art Gallery';
    let shareText = `Check out this amazing artwork from ${businessName}:\n\n`;
    shareText += `Product: ${product.name}\n`;
    shareText += `Product ID: ${product.id}\n`;
    shareText += `Artist: ${product.artist_name}\n`;
    shareText += `Size: ${product.width} × ${product.height}\n`;
    shareText += `Price: ₹${product.price}\n`;
    
    // Add mockup image links if available
    if (product.images && product.images.length > 0) {
        const mockupImages = product.images.filter(image => image.is_mockup === 1);
        if (mockupImages.length > 0) {
            shareText += `Images:\n`;
            mockupImages.forEach((image, index) => {
                const imageUrl = IMAGE_BASE_URL + image.image;
                shareText += `${index + 1}. ${imageUrl}\n`;
            });
        }
    }
    
    shareText += `\nGallery URL: ${window.location.href}`;
    
    const shareData = {
        title: product.name,
        text: shareText,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Product details copied to clipboard!');
        });
    }
}

function shareGallery() {
    const shareData = {
        title: `${currentBusiness?.business_name || 'Art Gallery'} Collection`,
        text: 'Explore our beautiful art collection',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(shareData.url).then(() => {
            alert('Gallery link copied to clipboard!');
        });
    }
}

// WhatsApp sharing for wishlist
function shareWishlistOnWhatsApp() {
    if (wishlist.length === 0) {
        alert('Your wishlist is empty!');
        return;
    }
    
    if (!currentBusiness?.phone) {
        alert('Business phone number not available');
        return;
    }
    
    // Format phone number (remove spaces, dashes, etc.) and add country code if missing
    let phoneNumber = currentBusiness.phone.replace(/[\s\-\(\)]/g, '');
    
    // Add +91 country code if not present
    if (!phoneNumber.startsWith('+91') && !phoneNumber.startsWith('91')) {
        phoneNumber = '+91' + phoneNumber;
    } else if (phoneNumber.startsWith('91') && !phoneNumber.startsWith('+91')) {
        phoneNumber = '+' + phoneNumber;
    }
    
    // Create wishlist message
    const businessName = currentBusiness.business_name || 'Art Gallery';
    let message = `Hello! I'm interested in the following products from ${businessName}:\n\n`;
    
    wishlist.forEach((item, index) => {
        const product = allProducts.find(p => p.id === item.productId);
        if (product) {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Product ID: ${item.productId}\n`;
            message += `   Artist: ${product.artist_name}\n`;
            message += `   Size: ${product.width} × ${product.height}\n`;
            message += `   Price: ₹${item.price}\n`;
            
            // Add mockup image links if available
            if (product.images && product.images.length > 0) {
                const mockupImages = product.images.filter(image => image.is_mockup === 1);
                if (mockupImages.length > 0) {
                    message += `   Images:\n`;
                    mockupImages.forEach((image, imgIndex) => {
                        const imageUrl = IMAGE_BASE_URL + image.image;
                        message += `   ${imgIndex + 1}. ${imageUrl}\n`;
                    });
                }
            }
            message += `\n`;
        } else {
            message += `${index + 1}. ${item.name} by ${item.artist}\n`;
            message += `   Price: ₹${item.price}\n\n`;
        }
    });
    
    message += `Please contact me for more details about these products.`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
}

// Contact functionality
function contactBusiness() {
    if (currentBusiness?.phone) {
        // Format phone number for tel: link
        let phoneNumber = currentBusiness.phone.replace(/[\s\-\(\)]/g, '');
        
        // Add +91 country code if not present
        if (!phoneNumber.startsWith('+91') && !phoneNumber.startsWith('91')) {
            phoneNumber = '+91' + phoneNumber;
        } else if (phoneNumber.startsWith('91') && !phoneNumber.startsWith('+91')) {
            phoneNumber = '+' + phoneNumber;
        }
        
        window.open(`tel:${phoneNumber}`);
    } else if (currentBusiness?.email) {
        window.open(`mailto:${currentBusiness.email}`);
    } else {
        alert('Contact information not available');
    }
}

// Show loading overlay
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// Main initialization function
async function initializeGallery() {
    console.log('Initializing gallery...');
    const params = getUrlParameters();
    console.log('Parsed params:', params);
    
    if (!params) {
        showError('Invalid URL parameters. Please check the URL format.');
        return;
    }

    try {
        showLoading();
        
        // Show loading state
        const container = document.getElementById('products-container');
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading gallery...</p>
            </div>
        `;

        // Fetch business details
        const business = await fetchBusinessDetails(params.businessId);
        if (!business) {
            showError('Business not found. Please check the business ID.');
            hideLoading();
            return;
        }
        
        // Check if business is active
        if (!business.is_active) {
            showError(`Business "${business.business_name}" is currently inactive. Please contact the business owner.`);
            hideLoading();
            return;
        }
        
        // Update business info
        updateBusinessInfo(business);

        // Fetch all products
        const productPromises = params.productIds.map(id => fetchProductDetails(id, params.businessId));
        const products = await Promise.all(productPromises);
        const validProducts = products.filter(product => product !== null);

        if (validProducts.length === 0) {
            showError('No valid products found. Please check the product IDs and business verification.');
            hideLoading();
            return;
        }

        // Store products globally
        allProducts = validProducts;

        // Render products
        renderProducts();
        
        // Setup additional features
        setupKeyboardNavigation();
        updateWishlistUI();
        
        // Setup event listeners
        setupEventListeners();
        
        hideLoading();

    } catch (error) {
        console.error('Error initializing gallery:', error);
        showError('Failed to load gallery. Please try again.');
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Modal close
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('product-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Wishlist sidebar
    document.getElementById('wishlist-toggle').addEventListener('click', toggleWishlistSidebar);
    document.querySelector('.close-wishlist').addEventListener('click', closeWishlist);
    
    // Modal buttons
    document.getElementById('modal-wishlist-btn').addEventListener('click', function() {
        const productId = parseInt(this.closest('.modal').dataset.productId);
        toggleWishlist(productId);
        openProductModal(productId); // Refresh modal
    });
    
    document.getElementById('modal-share-btn').addEventListener('click', function() {
        const productId = parseInt(this.closest('.modal').dataset.productId);
        shareProduct(productId);
    });
    
    document.getElementById('modal-contact-btn').addEventListener('click', contactBusiness);
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Slide tap to open modal (excluding wishlist button)
    document.getElementById('products-container').addEventListener('click', function(event) {
        if (event.target.closest('.wishlist-btn-slide') || event.target.closest('.quick-view-btn')) {
            return;
        }
        const slide = event.target.closest('.trending-slide');
        if (slide) {
            const productId = parseInt(slide.dataset.productId);
            if (productId) {
                openProductModal(productId);
            }
        }
    });
    
    // WhatsApp share button
    document.getElementById('whatsapp-share-btn').addEventListener('click', shareWishlistOnWhatsApp);
}

// Show error message
function showError(message) {
    const container = document.getElementById('products-container');
    container.innerHTML = `
        <div class="error-message">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <p>${message}</p>
        </div>
    `;
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeGallery);