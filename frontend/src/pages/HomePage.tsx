import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../services/api.js';
import { productService } from '../services/productService.js';
import { ProductCard } from '../components/ProductCard.js';
import type { Product } from '../types/product.js';

interface HealthStatus {
  checked: boolean;
  success?: boolean;
  message?: string;
  database?: string;
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Curated tab state: 'featured' | 'newest' | 'deals'
  const [activeTab, setActiveTab] = useState<'featured' | 'newest' | 'deals'>('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Subtle health state
  const [health, setHealth] = useState<HealthStatus>({ checked: false });

  // Brands config
  const brands = [
    {
      id: 'apple',
      name: 'Apple',
      tagline: 'Titanium. Super Retina.',
      logo: '🍏',
      href: '/products?category=apple',
    },
    {
      id: 'samsung',
      name: 'Samsung',
      tagline: 'Galaxy AI & Foldables',
      logo: '🪐',
      href: '/products?category=samsung',
    },
    {
      id: 'oneplus',
      name: 'OnePlus',
      tagline: 'Never Settle. 100W Charging.',
      logo: '⚡',
      href: '/products?category=oneplus',
    },
    {
      id: 'google',
      name: 'Google Pixel',
      tagline: 'Tensor G3 & Pro Cameras',
      logo: '🔍',
      href: '/products?category=google',
    },
    {
      id: 'xiaomi',
      name: 'Xiaomi',
      tagline: 'Leica Optics Innovation',
      logo: '🔴',
      href: '/products?category=xiaomi',
    },
  ];

  // Fetch products based on active tab
  useEffect(() => {
    let isMounted = true;
    setLoadingProducts(true);

    const loadTabProducts = async () => {
      try {
        let sortParam: string = 'newest';
        if (activeTab === 'deals') {
          sortParam = 'price-asc';
        } else if (activeTab === 'featured') {
          sortParam = 'price-desc';
        }

        const data = await productService.getProducts({ sort: sortParam, limit: 4 });
        if (isMounted) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load products for homepage:', err);
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    loadTabProducts();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Check health quietly in background
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (isMounted) {
          setHealth({
            checked: true,
            success: response.data.success,
            message: response.data.message,
            database: response.data.database,
          });
        }
      } catch {
        if (isMounted) {
          setHealth({ checked: true, success: false });
        }
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="home-container">
      {/* 1. HERO SECTION */}
      <section className="home-hero-section">
        <div className="hero-content">
          <div className="hero-promo-badge">
            <span className="promo-pulse" aria-hidden="true"></span>
            <span>🔥 2026 Smartphone Gala • Limited Flagship Deals</span>
          </div>

          <h1 className="hero-title">
            {isAuthenticated ? (
              <>
                Welcome back, <span className="hero-gradient-text">{user?.firstName}!</span>
              </>
            ) : (
              <>
                Next-Gen Flagships.
                <span className="hero-gradient-text">Unrivaled Experience.</span>
              </>
            )}
          </h1>

          <p className="hero-subtitle">
            Discover titanium craftsmanship, cutting-edge AI features, pro-grade camera systems, and lightning 5G speeds. Your next smartphone upgrade starts right here.
          </p>

          <div className="hero-cta-group">
            <Link to="/products" className="btn-hero-primary">
              <span>🚀 Explore Smartphones</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link to="/products?sort=price-asc" className="btn-hero-secondary">
              <span>🏷️ View Flash Deals</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup Showcase */}
        <div className="hero-visual-card">
          <div className="hero-phone-showcase">
            <div className="showcase-badge-top">
              <span>⭐ Featured Flagship of the Week</span>
            </div>

            <div className="phone-mockup-graphic">
              <div className="phone-dynamic-island"></div>
              <div className="phone-screen-content">
                <div className="screen-lens-icon">📱</div>
                <div className="screen-phone-title">Titanium Edition</div>
                <div className="screen-phone-sub">Pro Camera & AI Power</div>
              </div>
            </div>

            <div className="floating-specs-list">
              <div className="floating-spec-item">
                <span className="spec-icon">📸</span>
                <span>200MP Quad-Zoom OIS Optics</span>
              </div>
              <div className="floating-spec-item">
                <span className="spec-icon">⚡</span>
                <span>Snapdragon 8 Gen 3 / Apple A17 Pro</span>
              </div>
              <div className="floating-spec-item">
                <span className="spec-icon">🔋</span>
                <span>5000mAh Battery • 120W Fast Charge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STORE TRUST & PERKS STRIP */}
      <section className="trust-strip" aria-label="Customer Benefits">
        <div className="trust-item">
          <div className="trust-icon-box">🚚</div>
          <div>
            <h3 className="trust-title">Free Express Shipping</h3>
            <p className="trust-desc">Insured doorstep dispatch across all smartphones</p>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box">🛡️</div>
          <div>
            <h3 className="trust-title">1-Year Official Warranty</h3>
            <p className="trust-desc">100% Genuine, brand-authorized warranty</p>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box">🔄</div>
          <div>
            <h3 className="trust-title">7-Day Easy Replacement</h3>
            <p className="trust-desc">Zero hassles, guaranteed device exchange</p>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon-box">💳</div>
          <div>
            <h3 className="trust-title">Flexible Payments</h3>
            <p className="trust-desc">Cash on Delivery & No-Cost EMI available</p>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY BRAND */}
      <section className="brands-section">
        <div className="section-header-centered">
          <span className="section-tag">Authorized Retailer</span>
          <h2 className="section-title">Shop by Smartphone Brand</h2>
          <p className="section-subtitle">
            Explore official authorized collections with manufacturer warranty and direct support
          </p>
        </div>

        <div className="brands-grid">
          {brands.map((brand) => (
            <Link key={brand.id} to={brand.href} className="brand-card">
              <div className="brand-logo-emblem">{brand.logo}</div>
              <h3 className="brand-name">{brand.name}</h3>
              <p className="brand-tagline">{brand.tagline}</p>
              <span className="brand-link-cta">
                <span>View Models</span>
                <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. CURATED SMARTPHONES SHOWCASE */}
      <section className="curated-section">
        <div className="curated-header-bar">
          <div>
            <span className="section-tag">Handpicked Selection</span>
            <h2 className="section-title" style={{ marginBottom: '0.2rem' }}>
              Trending Smartphone Catalog
            </h2>
            <p className="section-subtitle">
              High-performance flagships, innovative foldables, and top-rated daily drivers
            </p>
          </div>

          <div className="curated-tabs" role="tablist" aria-label="Product collections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'featured'}
              className={`curated-tab-btn ${activeTab === 'featured' ? 'active' : ''}`}
              onClick={() => setActiveTab('featured')}
            >
              🔥 Premium Flagships
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'newest'}
              className={`curated-tab-btn ${activeTab === 'newest' ? 'active' : ''}`}
              onClick={() => setActiveTab('newest')}
            >
              ⚡ New Arrivals
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deals'}
              className={`curated-tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
              onClick={() => setActiveTab('deals')}
            >
              💎 Best Value
            </button>
          </div>

          <Link to="/products" className="view-all-smartphones-link">
            <span>Explore Complete Catalog</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {loadingProducts ? (
          <div className="loading-container" style={{ padding: '4rem 1rem' }}>
            <div className="spinner" aria-hidden="true"></div>
            <p>Loading curated smartphones...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p>No smartphones found in this category.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. DEAL OF THE WEEK BANNER */}
      <section className="deal-banner">
        <div className="deal-content">
          <div className="deal-badge">
            <span>⚡ LIMITED TIME FLAGSHIP OFFER</span>
          </div>
          <h2 className="deal-title">Samsung Galaxy S24 Ultra 5G</h2>
          <p className="deal-desc">
            Galaxy AI is unleashed. Experience 200MP detail, built-in S-Pen productivity, 
            Corning Gorilla Armor anti-reflective glass, and durable Titanium frame.
          </p>

          <div className="deal-price-row">
            <span className="deal-price-curr">₹1,29,999</span>
            <span className="deal-price-orig">₹1,39,999</span>
            <span className="deal-savings-tag">SAVE ₹10,000</span>
          </div>

          <Link to="/products?search=S24" className="btn-deal-cta">
            Grab Flagship Deal Now &rarr;
          </Link>
        </div>

        <div className="deal-countdown-box">
          <span className="countdown-label">Offer Expires In</span>
          <div className="countdown-digits">
            <div className="digit-block">
              <span className="digit-num">02</span>
              <span className="digit-unit">Days</span>
            </div>
            <div className="digit-block">
              <span className="digit-num">14</span>
              <span className="digit-unit">Hours</span>
            </div>
            <div className="digit-block">
              <span className="digit-num">38</span>
              <span className="digit-unit">Mins</span>
            </div>
            <div className="digit-block">
              <span className="digit-num">50</span>
              <span className="digit-unit">Secs</span>
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            🚚 Includes Free Express Insured Delivery
          </span>
        </div>
      </section>

      {/* 6. WHY SHOP WITH US (Customer Value Pillars) */}
      <section className="customer-pillars-section">
        <div className="section-header-centered">
          <span className="section-tag">Why Mobile Shop</span>
          <h2 className="section-title">The Standard in Smartphone Shopping</h2>
          <p className="section-subtitle">
            Engineered for pure peace of mind with authentic hardware and white-glove service
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-box">🛡️</div>
            <h3 className="pillar-title">100% Genuine Devices</h3>
            <p className="pillar-desc">
              Every phone is sourced directly from certified brand distributors with original sealed factory boxes.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">🚀</div>
            <h3 className="pillar-title">Insured Express Courier</h3>
            <p className="pillar-desc">
              Tamper-evident security packaging and real-time tracking from our climate-controlled warehouse to your hands.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">💳</div>
            <h3 className="pillar-title">Zero-Risk Checkout</h3>
            <p className="pillar-desc">
              Multiple secure payment channels including Cash on Delivery, instant card transactions, and flexible EMI.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-box">🎧</div>
            <h3 className="pillar-title">Dedicated Smartphone Help</h3>
            <p className="pillar-desc">
              Need help choosing or transferring contacts? Our smartphone advisors are always just one message away.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="section-header-centered">
          <span className="section-tag">Real Buyer Reviews</span>
          <h2 className="section-title">Loved by Smartphone Enthusiasts</h2>
          <p className="section-subtitle">
            See what verified customers say about their unboxing and buying experience
          </p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">
              "Received my Apple iPhone 15 Pro Max the very next afternoon! The box was sealed, flawless, and the order tracking gave me step-by-step updates."
            </p>
            <div className="testimonial-author-row">
              <div className="author-avatar">RV</div>
              <div>
                <div className="author-name">Rahul Varma</div>
                <div className="author-product">Verified Buyer • iPhone 15 Pro Max</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">
              "The OnePlus 12 5G deal was unbeatable. The 100W charging is mindblowing. Cash on Delivery was completely smooth without any unexpected charges."
            </p>
            <div className="testimonial-author-row">
              <div className="author-avatar">PS</div>
              <div>
                <div className="author-name">Priya Sharma</div>
                <div className="author-product">Verified Buyer • OnePlus 12 5G</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">
              "Exceptional customer experience. I ordered the Pixel 8 Pro and the camera is phenomenal. Best online electronics store I've purchased from."
            </p>
            <div className="testimonial-author-row">
              <div className="author-avatar">AK</div>
              <div>
                <div className="author-name">Amit Kulkarni</div>
                <div className="author-product">Verified Buyer • Google Pixel 8 Pro</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VIP NEWSLETTER / FLASH SALE CLUB */}
      <section className="newsletter-card">
        <div className="newsletter-text">
          <h2 className="newsletter-title">Join the Flagship VIP Club</h2>
          <p className="newsletter-desc">
            Get instant early-access alerts for phone launches, exclusive discount promo codes, and special flash sales directly in your inbox.
          </p>
        </div>

        {newsletterSubmitted ? (
          <div style={{ color: '#34d399', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎉 Thank you for subscribing! We'll keep you posted on the hottest drops.</span>
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email address..."
              className="newsletter-input"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-btn">
              Get VIP Drops
            </button>
          </form>
        )}
      </section>

      {/* 9. SUBTLE SYSTEM HEALTH BADGE */}
      {health.checked && (
        <div className="subtle-health-indicator" title={`DB: ${health.database || 'connected'}`}>
          <span className={`health-dot ${health.success ? '' : 'offline'}`} style={{ backgroundColor: health.success ? '#34d399' : '#ef4444' }}></span>
          <span>{health.success ? 'Mobile Shop Cloud API Online' : 'Cloud Sync Offline'}</span>
        </div>
      )}
    </div>
  );
};
