import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(data.items);
      setSubtotal(data.subtotal);
    } catch {
      // silent — user may be logged out
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  async function addToCart(productId, quantity = 1) {
    await api.post('/cart', { productId, quantity });
    await refreshCart();
  }

  async function updateQuantity(cartItemId, quantity) {
    await api.put(`/cart/${cartItemId}`, { quantity });
    await refreshCart();
  }

  async function removeItem(cartItemId) {
    await api.delete(`/cart/${cartItemId}`);
    await refreshCart();
  }

  async function clearCart() {
    await api.delete('/cart');
    await refreshCart();
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, subtotal, itemCount, loading, addToCart, updateQuantity, removeItem, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
