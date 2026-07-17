import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShoppingBag, Sparkles, Award, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Categories and Featured Products
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const catRes = await fetch('http://localhost:8000/api/products/categories/');
        const prodRes = await fetch('http://localhost:8000/api/products/items/');
        
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.slice(0, 5));
        }
        
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          // Display first 4 products as featured
          setFeaturedProducts(prodData.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="animate-fadein">
      {/* 1. Hero Shopping Section */}
      <section style={{
        background: 'linear-gradient(135deg, hsl(224, 76%, 95%) 0%, hsl(220, 20%, 97%) 100%)',
        padding: '80px 0 60px 0',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '40px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              <Sparkles size={14} /> Smart E-Commerce Platform
            </div>
            
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '3.25rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
              color: 'var(--text)',
              lineHeight: 1.15
            }}>
              Everyday essentials <br/>
              <span style={{
                background: 'linear-gradient(135deg, var(--primary), var(--success))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                delivered to your doorstep.
              </span>
            </h1>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '480px' }}>
              Shop your favourite personal care, household hygiene, and grocery items. Safe delivery, easy Cash on Delivery, and AI-powered order tracking.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Link to="/shop" className="btn btn-primary" style={{ padding: '14px 28px' }}>
                <ShoppingBag size={18} /> Shop Now
              </Link>
              <a href="#categories" className="btn btn-secondary" style={{ padding: '14px 28px' }}>
                Browse Categories
              </a>
            </div>
          </div>

          {/* Banner Graphics */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '380px',
              height: '380px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(45deg, var(--primary), var(--success))',
              position: 'absolute',
              opacity: 0.1,
              filter: 'blur(40px)',
              zIndex: 1
            }}></div>
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60"
              alt="Grocery shopping basket"
              style={{
                width: '100%',
                maxWidth: '460px',
                height: '320px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 2,
                border: '1px solid var(--border)'
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Prominent Search Experience */}
      <section style={{ marginTop: '-28px', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <form onSubmit={handleSearchSubmit} className="glass" style={{
            display: 'flex',
            padding: '8px',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, paddingLeft: '16px' }}>
              <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
              <input 
                type="text" 
                placeholder="Search for soaps, detergents, flour, floor cleaners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  color: 'var(--text)',
                  width: '100%'
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '12px 24px' }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 3. Product Categories Section */}
      <section id="categories" style={{ padding: '60px 0 40px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>Browse Categories</h2>
              <p style={{ color: 'var(--text-muted)' }}>Explore our range of home products</p>
            </div>
            <Link to="/shop" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View All Shop <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '40px' }}>
              <span>Loading categories...</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px'
            }}>
              {categories.map((cat) => (
                <Link 
                  to={`/shop?category=${cat.id}`} 
                  key={cat.id} 
                  className="card card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <ShoppingBag size={24} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{cat.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>View Items</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section style={{ padding: '40px 0 60px 0', backgroundColor: 'rgba(241, 245, 249, 0.3)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>Featured Products</h2>
              <p style={{ color: 'var(--text-muted)' }}>Top recommendations for your household</p>
            </div>
            <Link to="/shop" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              View Catalog <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '40px' }}>
              <span>Loading products...</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px'
            }}>
              {featuredProducts.map((prod) => {
                const defaultVariant = prod.variants?.[0];
                return (
                  <div key={prod.id} className="card card-hover" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    height: '100%',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)'
                  }}>
                    <Link to={`/product/${prod.id}`}>
                      <div style={{
                        height: '160px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'hsl(220, 20%, 98%)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        marginBottom: '16px',
                        position: 'relative'
                      }}>
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                        {defaultVariant && defaultVariant.current_stock === 0 && (
                          <span className="badge badge-danger" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </Link>

                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {prod.brand}
                      </span>
                      <Link to={`/product/${prod.id}`} style={{ display: 'block', margin: '4px 0 8px 0' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem', lineHeight: 1.25 }}>
                          {prod.name}
                        </h4>
                      </Link>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                            {defaultVariant ? defaultVariant.name : 'Standard'}
                          </span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                            ₹{defaultVariant ? defaultVariant.price : 'N/A'}
                          </span>
                        </div>
                        {defaultVariant && defaultVariant.current_stock > 0 ? (
                          <button 
                            onClick={() => addToCart(prod, defaultVariant, 1)}
                            className="btn btn-primary"
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <button 
                            className="btn btn-secondary" 
                            disabled 
                            style={{ padding: '8px 12px', fontSize: '0.85rem', opacity: 0.6 }}
                          >
                            Sold Out
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. Loyalty & AI Promotion Cards */}
      <section style={{ padding: '60px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Loyalty Promo */}
          <div className="card" style={{
            display: 'flex',
            gap: '20px',
            background: 'linear-gradient(135deg, hsl(142, 72%, 96%) 0%, var(--surface) 100%)',
            border: '1px solid hsl(142, 50%, 85%)',
            padding: '32px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--success)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                Shop. Earn Points. Save More.
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '16px' }}>
                Earn loyalty points on every purchase (1 point per ₹10 spent) automatically awarded after successful delivery. Redeem points for discount rewards on future orders.
              </p>
              <Link to="/loyalty" style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                Explore Loyalty Program <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* AI Chatbot Promo */}
          <div className="card" style={{
            display: 'flex',
            gap: '20px',
            background: 'linear-gradient(135deg, hsl(224, 76%, 95%) 0%, var(--surface) 100%)',
            border: '1px solid hsl(224, 50%, 85%)',
            padding: '32px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                Ask Our AI Shopping Assistant
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '16px' }}>
                Not sure what to buy or looking to track your delivery status? Speak with our live chatbot at the bottom-right for instant answers.
              </p>
              <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>
                Try Prompt: "Do you have Dove soap?" <Flame size={14} />
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
