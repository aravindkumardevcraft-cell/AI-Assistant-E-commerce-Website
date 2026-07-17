import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart on init or auth change
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      if (token) {
        // Authenticated user: Load from backend
        try {
          await mergeLocalCartWithDB(token);
          const response = await fetch('http://localhost:8000/api/cart/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            // Expected backend data format: { items: [{ product: {...}, variant: {...}, quantity: N }] }
            setCartItems(data.items || []);
          } else {
            console.error('Failed to fetch backend cart, falling back to local');
            loadLocalCart();
          }
        } catch (err) {
          console.error('Cart fetch error:', err);
          loadLocalCart();
        }
      } else {
        // Guest user: Load from localStorage
        loadLocalCart();
      }
      setLoading(false);
    };

    fetchCart();
  }, [token]);

  const loadLocalCart = () => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  };

  // Save guest cart to localStorage
  useEffect(() => {
    if (!token && !loading) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, token, loading]);

  // Merge local cart to database after user login
  const mergeLocalCartWithDB = async (newToken) => {
    const savedLocal = localStorage.getItem('cart');
    if (!savedLocal) return;
    try {
      const items = JSON.parse(savedLocal);
      if (items.length === 0) return;

      // Push all local items to backend database
      await fetch('http://localhost:8000/api/cart/merge/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`
        },
        body: JSON.stringify({ items })
      });
      localStorage.removeItem('cart');
    } catch (e) {
      console.error('Error merging local cart with database:', e);
    }
  };

  const addToCart = async (product, variant, quantity = 1) => {
    const newItem = {
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url || '/placeholder-product.png',
        brand: product.brand,
      },
      variant: {
        id: variant.id,
        name: variant.name,
        price: parseFloat(variant.price),
        stock: variant.stock,
      },
      quantity: quantity
    };

    let updated;
    // Check if variant already in cart
    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id && item.variant.id === variant.id
    );

    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cartItems, newItem];
    }

    setCartItems(updated);

    // Sync to backend DB if authenticated
    if (token) {
      try {
        await fetch('http://localhost:8000/api/cart/items/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: product.id,
            variant_id: variant.id,
            quantity: quantity
          })
        });
      } catch (err) {
        console.error('Failed to sync add item to backend cart:', err);
      }
    }
  };

  const updateQuantity = async (productId, variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    const updated = cartItems.map(item => {
      if (item.product.id === productId && item.variant.id === variantId) {
        return { ...item, quantity };
      }
      return item;
    });

    setCartItems(updated);

    if (token) {
      try {
        await fetch('http://localhost:8000/api/cart/items/update/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: productId,
            variant_id: variantId,
            quantity
          })
        });
      } catch (err) {
        console.error('Failed to sync update quantity to backend cart:', err);
      }
    }
  };

  const removeFromCart = async (productId, variantId) => {
    const updated = cartItems.filter(
      item => !(item.product.id === productId && item.variant.id === variantId)
    );
    setCartItems(updated);

    if (token) {
      try {
        await fetch('http://localhost:8000/api/cart/items/remove/', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: productId,
            variant_id: variantId
          })
        });
      } catch (err) {
        console.error('Failed to sync remove item to backend cart:', err);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (token) {
      try {
        await fetch('http://localhost:8000/api/cart/clear/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Failed to clear backend cart:', err);
      }
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  
  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      mergeLocalCartWithDB,
      cartCount,
      cartSubtotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
