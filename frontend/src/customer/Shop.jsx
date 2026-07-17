import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, Info, Check, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Search Parameters
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep state in sync with URL parameters
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/products/categories/');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (searchQuery) queryParams.append('search', searchQuery);
        if (selectedBrand) queryParams.append('brand', selectedBrand);

        const res = await fetch(`http://localhost:8000/api/products/items/?${queryParams.toString()}`);
        if (res.ok) {
          let data = await res.json();
          
          // Apply local filters like in-stock-only
          if (showInStockOnly) {
            data = data.filter(prod => 
              prod.variants?.some(v => v.current_stock > 0)
            );
          }

          setProducts(data);

          // Dynamically extract unique brands from loaded products to populate brand filter
          const uniqueBrands = [...new Set(data.map(p => p.brand))];
          if (brands.length === 0 && uniqueBrands.length > 0) {
            setBrands(uniqueBrands);
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, selectedBrand, showInStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchQuery.trim()) {
        prev.set('search', searchQuery.trim());
      } else {
        prev.delete('search');
      }
      return prev;
    });
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSearchParams(prev => {
      if (catId) {
        prev.set('category', catId);
      } else {
        prev.delete('category');
      }
      return prev;
    });
  };

  // State to manage active variants for each product card
  // Map of productId -> selectedVariantId
  const [selectedVariants, setSelectedVariants] = useState({});

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantId
    }));
  };

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Store Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Quality essentials, reasonable prices.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Sidebar Filters */}
        <aside className="card" style={{ padding: '20px', position: 'sticky', top: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Filters</h3>
          </div>

          {/* Categories Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => handleCategorySelect('')}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: selectedCategory === '' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: selectedCategory === '' ? '600' : 'normal',
                  fontSize: '0.9rem'
                }}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id.toString())}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: selectedCategory === cat.id.toString() ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: selectedCategory === cat.id.toString() ? '600' : 'normal',
                    fontSize: '0.9rem'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Availability</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
              <input 
                type="checkbox" 
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              In Stock Only
            </label>
          </div>

          {/* Brand Filter */}
          {brands.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Brands</h4>
              <select 
                className="form-input" 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <option value="">All Brands</option>
                {brands.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </aside>

        {/* Product Grid & Search */}
        <div>
          {/* Top Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px', width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {/* Catalog grid */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <span>Loading products catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <Info size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No products found</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Try adjusting your filters, searching for another keyword, or talk to our AI assistant.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '24px'
            }}>
              {products.map((prod) => {
                // Determine current selected variant for this card
                const selectedVariantId = selectedVariants[prod.id] || prod.variants?.[0]?.id;
                const activeVariant = prod.variants?.find(v => v.id === selectedVariantId) || prod.variants?.[0];

                return (
                  <div key={prod.id} className="card card-hover" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)'
                  }}>
                    {/* Image Area */}
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
                      {activeVariant && activeVariant.current_stock === 0 && (
                        <span className="badge badge-danger" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {prod.brand}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: '4px 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem', lineHeight: 1.25 }}>
                        {prod.name}
                      </h4>

                      {/* Variant Selector Dropdown */}
                      {prod.variants && prod.variants.length > 1 && (
                        <div style={{ marginBottom: '16px' }}>
                          <select 
                            className="form-input" 
                            value={activeVariant?.id} 
                            onChange={(e) => handleVariantChange(prod.id, parseInt(e.target.value))}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                          >
                            {prod.variants.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.name} - ₹{v.price} ({v.current_stock > 0 ? `${v.current_stock} in stock` : 'Out of stock'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Price and Cart Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {activeVariant ? activeVariant.name : 'Standard'}
                          </span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                            ₹{activeVariant ? activeVariant.price : 'N/A'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link 
                            to={`/product/${prod.id}`} 
                            className="btn btn-secondary" 
                            style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </Link>
                          {activeVariant && activeVariant.current_stock > 0 ? (
                            <button 
                              onClick={() => addToCart(prod, activeVariant, 1)}
                              className="btn btn-primary"
                              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            >
                              Add
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              disabled 
                              style={{ padding: '8px 12px', fontSize: '0.85rem', opacity: 0.6 }}
                            >
                              Sold
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
