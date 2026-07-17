import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, ToggleLeft, ToggleRight, Sparkles, Check, X, ShieldAlert, Layers } from 'lucide-react';

export default function Products() {
  const { token } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null); // For variants

  // Form Fields
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  
  const [varName, setVarName] = useState('');
  const [varSku, setVarSku] = useState('');
  const [varPrice, setVarPrice] = useState('');

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const prodRes = await fetch('http://localhost:8000/api/products/items/', { headers });
      const catRes = await fetch('http://localhost:8000/api/products/categories/');

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData);
        setCategories(catData);
      } else {
        setError('Failed to fetch catalog data.');
      }
    } catch (err) {
      setError('Error connecting to the database server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleActive = async (productId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/products/items/${productId}/toggle_active/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccess('Product visibility status updated successfully!');
        fetchData();
      } else {
        setError('Failed to toggle active status.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error.');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !prodBrand || !prodCat) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      name: prodName,
      brand: prodBrand,
      category: parseInt(prodCat),
      description: prodDesc,
      image_url: prodImage || '/placeholder-product.png',
      is_active: true
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`http://localhost:8000/api/products/items/${editingProduct.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://localhost:8000/api/products/items/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setSuccess(editingProduct ? 'Product details updated!' : 'New product created successfully!');
        setIsProductModalOpen(false);
        resetProductForm();
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to save product details.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    if (!varName || !varSku || !varPrice) {
      setError('Please fill in all variant details.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      product_id: activeProductId,
      name: varName,
      sku: varSku.toUpperCase().replace(/\s+/g, '-'),
      price: parseFloat(varPrice)
    };

    try {
      const res = await fetch('http://localhost:8000/api/products/variants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess('Product variant successfully added with initial stock configured as 0!');
        setIsVariantModalOpen(false);
        resetVariantForm();
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to create product variant. Verify SKU is unique.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdBrand(product.brand);
    setProdCat(product.category.toString());
    setProdDesc(product.description || '');
    setProdImage(product.image_url || '');
    setIsProductModalOpen(true);
  };

  const openAddVariantModal = (productId) => {
    setActiveProductId(productId);
    resetVariantForm();
    setIsVariantModalOpen(true);
  };

  const resetProductForm = () => {
    setProdName('');
    setProdBrand('');
    setProdCat('');
    setProdDesc('');
    setProdImage('');
  };

  const resetVariantForm = () => {
    setVarName('');
    setVarSku('');
    setVarPrice('');
  };

  return (
    <div className="animate-fadein">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800 }}>Product Catalog Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create, update, and manage product inventory listings.</p>
        </div>
        <button onClick={openAddProductModal} className="btn btn-primary">
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', borderLeft: '4px solid var(--danger)' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', borderLeft: '4px solid var(--success)' }}>
          {success}
        </div>
      )}

      {loading && products.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span>Loading catalog details...</span>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px' }}>Product</th>
                <th style={{ padding: '16px 24px' }}>Brand</th>
                <th style={{ padding: '16px 24px' }}>Category</th>
                <th style={{ padding: '16px 24px' }}>Variants</th>
                <th style={{ padding: '16px 24px' }}>Status</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                  {/* Product block */}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={prod.image_url} 
                        alt={prod.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '4px', padding: '4px' }} 
                      />
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text)' }}>{prod.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {prod.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{prod.brand}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className="badge badge-primary">{prod.category_name}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {prod.variants && prod.variants.map((v) => (
                        <span key={v.id} style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
                          &bull; {v.name} (SKU: {v.sku}) - <strong>₹{v.price}</strong>
                        </span>
                      ))}
                      {(!prod.variants || prod.variants.length === 0) && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>No variants added!</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${prod.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {prod.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button 
                        onClick={() => openAddVariantModal(prod.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Layers size={14} /> Add Variant
                      </button>
                      <button 
                        onClick={() => openEditProductModal(prod)}
                        className="btn-icon" 
                        style={{ width: '32px', height: '32px' }}
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(prod.id)}
                        className="btn-icon"
                        style={{ width: '32px', height: '32px', color: prod.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                        title={prod.is_active ? 'Deactivate Product' : 'Activate Product'}
                      >
                        {prod.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      {isProductModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
                {editingProduct ? 'Edit Product Details' : 'Add New Catalog Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input type="text" className="form-input" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Brand Name *</label>
                  <input type="text" className="form-input" value={prodBrand} onChange={(e) => setProdBrand(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={prodCat} onChange={(e) => setProdCat(e.target.value)} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="text" className="form-input" placeholder="https://..." value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" style={{ resize: 'vertical' }} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD VARIANT MODAL --- */}
      {isVariantModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Add Product Variant</h3>
              <button onClick={() => setIsVariantModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleVariantSubmit}>
              <div className="form-group">
                <label className="form-label">Variant Size/Label *</label>
                <input type="text" className="form-input" placeholder="e.g., 500 g, 1 L, Pack of 3" value={varName} onChange={(e) => setVarName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input type="text" className="form-input" placeholder="e.g., DOVE-SOAP-100G" value={varSku} onChange={(e) => setVarSku(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price (INR) *</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={varPrice} onChange={(e) => setVarPrice(e.target.value)} required />
              </div>

              <div style={{ backgroundColor: 'hsl(38, 92%, 96%)', color: 'hsl(38, 92%, 35%)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>Creating a variant automatically initializes its warehouse inventory record with a stock level of 0. Update stock levels on the Stock Inventory tab.</span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Add Variant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
