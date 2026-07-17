import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Plus, Minus, ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const { token, triggerLoginModal } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch product detail
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/products/items/${id}/`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          // Set initial active variant
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        } else {
          setError('Product not found or has been deactivated.');
        }
      } catch (err) {
        setError('Error connecting to server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity on variant change
  };

  const handleIncrement = () => {
    if (!selectedVariant) return;
    if (quantity < selectedVariant.current_stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    if (token) {
      addToCart(product, selectedVariant, quantity);
      alert(`${product.name} added to cart!`);
    } else {
      triggerLoginModal(() => {
        addToCart(product, selectedVariant, quantity);
      });
    }
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    if (token) {
      clearCart();
      addToCart(product, selectedVariant, quantity);
      navigate('/checkout');
    } else {
      triggerLoginModal(() => {
        clearCart();
        addToCart(product, selectedVariant, quantity);
        navigate('/checkout');
      });
    }
  };

  if (loading) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span>Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Product Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>{error}</p>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px' }}>
      {/* Back button link */}
      <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
        {/* Left Column: Product Image */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '420px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <img 
            src={product.image_url} 
            alt={product.name} 
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Right Column: Meta details */}
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.brand}
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, margin: '8px 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {product.name}
          </h1>

          {/* Category Tag */}
          <span className="badge badge-primary" style={{ marginBottom: '24px' }}>
            {product.category_name}
          </span>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '32px' }}>
            {product.description || 'No description available for this item.'}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Select Size / Package</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price and Stock Information */}
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Price</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                ₹{selectedVariant ? selectedVariant.price : '0.00'}
              </span>
            </div>
            
            {/* Stock Availability indicator */}
            <div style={{ marginTop: '8px' }}>
              {selectedVariant ? (
                selectedVariant.current_stock > 0 ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                    &bull; In Stock ({selectedVariant.current_stock} units available)
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
                    &bull; Out of Stock
                  </span>
                )
              ) : null}
            </div>
          </div>

          {/* Quantity and Actions */}
          {selectedVariant && selectedVariant.current_stock > 0 ? (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
              {/* Quantity selectors */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
                overflow: 'hidden'
              }}>
                <button 
                  onClick={handleDecrement}
                  style={{ padding: '12px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                <button 
                  onClick={handleIncrement}
                  style={{ padding: '12px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                  disabled={quantity >= selectedVariant.current_stock}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart button */}
              <button 
                onClick={handleAddToCart}
                className="btn btn-secondary"
                style={{ padding: '14px 24px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              {/* Buy Now button */}
              <button 
                onClick={handleBuyNow}
                className="btn btn-primary"
                style={{ padding: '14px 28px', flexGrow: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
              >
                <CreditCard size={18} /> Buy Now
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.925rem',
              fontWeight: 500,
              marginBottom: '40px',
              borderLeft: '4px solid var(--danger)'
            }}>
              This pack size is currently unavailable. Speak to our AI assistant to request notifications or suggest alternatives.
            </div>
          )}

          {/* Assurances */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            borderTop: '1px solid var(--border)',
            paddingTop: '24px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span>100% Genuine Products</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Truck size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span>Cash on Delivery Only</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <RotateCcw size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span>Easy 7-day returns</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
