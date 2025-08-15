// Global variables
let TrendingSlider;
let currentBusiness = null;
let allProducts = [];
let filteredProducts = [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
const BASE_URL = 'https://v2.architartgallery.in';
const IMAGE_BASE_URL = 'https://v2.architartgallery.in/storage/app/';

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
            return data.data;
        } else {
            throw new Error('Failed to fetch business details');
        }
    } catch (error) {
        console.error('Error fetching business details:', error);
        return null;
    }
}

// Fetch product details
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`${BASE_URL}/public/api/products/${productId}`);
        const data = await response.json();
        
        if (data.status) {
            return data.data;
        } else {
            throw new Error(`Failed to fetch product ${productId}`);
        }
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

// Update business information
function updateBusinessInfo(business) {
    console.log('Updating business info:', business);
    currentBusiness = business;
    
    const businessLogo = document.getElementById('business-logo');
    const businessName = document.getElementById('business-name');
    const footerBusinessName = document.getElementById('footer-business-name');
    const footerPhone = document.getElementById('footer-phone');
    const footerEmail = document.getElementById('footer-email');
    const footerGst = document.getElementById('footer-gst');
    
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
    footerBusinessName.textContent = business.business_name || 'Art Gallery';
    footerPhone.textContent = `Phone: ${business.phone || 'N/A'}`;
    footerEmail.textContent = `Email: ${business.email || 'N/A'}`;
    footerGst.textContent = `GST: ${business.gst || 'N/A'}`;
    document.title = `${business.business_name} - Art Gallery`;
}

// Create product slide HTML for a single image
function createProductSlideWithImage(product, imageUrl, imageIndex = 0, totalImages = 1) {
    const size = `${product.width} × ${product.height}`;
    const price = product.is_include_gst ? `₹${product.price} (Inc. GST)` : `₹${product.price}`;
    const isInWishlist = wishlist.some(item => item.productId === product.id);
    
    // Add image counter if there are multiple images
    const imageCounter = totalImages > 1 ? `<div class="image-counter">${imageIndex + 1}/${totalImages}</div>` : '';
    
    return `
        <div class="swiper-slide trending-slide" data-product-id="${product.id}" data-image-index="${imageIndex}">
            <div class="trending-slide-img">
                <div class="image-overlay"></div>
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
                ${imageCounter}
                <button class="quick-view-btn" onclick="openProductModal(${product.id}, ${imageIndex})">
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

// Create all slides for a product (one slide per image)
function createProductSlides(product) {
    const slides = [];
    
    if (product.images && product.images.length > 0) {
        // Create a slide for each image
        product.images.forEach((image, index) => {
            const imageUrl = IMAGE_BASE_URL + image.image;
            slides.push(createProductSlideWithImage(product, imageUrl, index, product.images.length));
        });
    } else {
        // Create a slide with placeholder image
        slides.push(createProductSlideWithImage(product, 'images/placeholder.jpg', 0, 1));
    }
    
    return slides;
}

// Initialize slider
function initializeSlider() {
    TrendingSlider = new Swiper('.trending-slider', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        slidesPerView: 'auto',
        speed: 3000,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
        },
        coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 250,
            modifier: 2.5,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        }
    });
}

// Search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    const categoryFilter = document.getElementById('category-filter');
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm) {
            clearSearch.style.display = 'block';
        } else {
            clearSearch.style.display = 'none';
        }
        filterProducts();
    });
    
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        filterProducts();
    });
    
    // Category filter
    categoryFilter.addEventListener('change', filterProducts);
    
    // Keyboard navigation
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

// Filter products based on search and category
function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.artist_name.toLowerCase().includes(searchTerm) ||
                            product.category?.name.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    renderProducts();
}

// Render filtered products
function renderProducts() {
    const container = document.getElementById('products-container');
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <ion-icon name="search-outline"></ion-icon>
                <p>No products found</p>
                <span>Try adjusting your search or filter criteria</span>
            </div>
        `;
        return;
    }
    
    const allSlides = [];
    filteredProducts.forEach(product => {
        const productSlides = createProductSlides(product);
        allSlides.push(...productSlides);
    });
    
    container.innerHTML = allSlides.join('');
    
    if (TrendingSlider) {
        TrendingSlider.destroy();
    }
    initializeSlider();
}

// Populate category filter
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    const categories = [...new Set(allProducts.map(product => product.category?.name).filter(Boolean))];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
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
                <img src="${item.image ? IMAGE_BASE_URL + item.image : 'images/placeholder.jpg'}" alt="${item.name}">
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
    
    // Set images
    if (product.images && product.images.length > 0) {
        modalMainImage.src = IMAGE_BASE_URL + product.images[imageIndex].image;
        
        // Create thumbnails
        thumbnailGallery.innerHTML = product.images.map((image, index) => `
            <img src="${IMAGE_BASE_URL + image.image}" 
                 alt="Thumbnail ${index + 1}" 
                 class="thumbnail ${index === imageIndex ? 'active' : ''}"
                 onclick="changeModalImage('${IMAGE_BASE_URL + image.image}', ${index})">
        `).join('');
    } else {
        modalMainImage.src = 'images/placeholder.jpg';
        thumbnailGallery.innerHTML = '';
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
    
    const shareData = {
        title: product.name,
        text: `Check out this amazing artwork: ${product.name} by ${product.artist_name}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Product link copied to clipboard!');
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
    
    // Format phone number (remove spaces, dashes, etc.)
    const phoneNumber = currentBusiness.phone.replace(/[\s\-\(\)]/g, '');
    
    // Create wishlist message
    const businessName = currentBusiness.business_name || 'Art Gallery';
    let message = `Hello! I'm interested in the following products from ${businessName}:\n\n`;
    
    wishlist.forEach((item, index) => {
        message += `${index + 1}. ${item.name} by ${item.artist}\n`;
        message += `   Price: ₹${item.price}\n\n`;
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
        window.open(`tel:${currentBusiness.phone}`);
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
        if (business) {
            updateBusinessInfo(business);
        }

        // Fetch all products
        const productPromises = params.productIds.map(id => fetchProductDetails(id));
        const products = await Promise.all(productPromises);
        const validProducts = products.filter(product => product !== null);

        if (validProducts.length === 0) {
            showError('No products found. Please check the product IDs.');
            return;
        }

        // Store products globally
        allProducts = validProducts;
        filteredProducts = validProducts;

        // Create slides (one slide per image per product)
        const allSlides = [];
        validProducts.forEach(product => {
            const productSlides = createProductSlides(product);
            allSlides.push(...productSlides);
        });
        
        const slidesHTML = allSlides.join('');
        container.innerHTML = slidesHTML;

        // Initialize slider
        initializeSlider();
        
        // Setup additional features
        setupSearchAndFilter();
        populateCategoryFilter();
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
    
    // Footer buttons
    document.getElementById('footer-contact-btn').addEventListener('click', contactBusiness);
    document.getElementById('footer-share-btn').addEventListener('click', shareGallery);
    
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