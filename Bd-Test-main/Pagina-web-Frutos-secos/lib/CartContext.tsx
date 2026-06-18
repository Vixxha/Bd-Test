'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('nutstore_cart');
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (e) {
          console.error('Failed to parse cart from localStorage:', e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('nutstore_cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      
      let newQty = quantity;
      if (existing) {
        newQty = existing.quantity + quantity;
      }
      
      // Limit stock
      if (newQty > product.stock) {
        newQty = product.stock;
        alert(`Lo sentimos, el stock disponible es de ${product.stock} ${product.sell_type === 'weight' ? 'Kg' : 'unidades'}.`);
      }

      if (newQty <= 0) {
        return prev.filter((item) => item.product.id !== product.id);
      }

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: Number(newQty.toFixed(3)) } : item
        );
      }

      return [...prev, { product, quantity: Number(newQty.toFixed(3)) }];
    });
    
    // Automatically open cart drawer on add
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;

      let newQty = quantity;
      if (newQty > existing.product.stock) {
        newQty = existing.product.stock;
        alert(`Lo sentimos, no hay suficiente stock. Límite: ${existing.product.stock} ${existing.product.sell_type === 'weight' ? 'Kg' : 'uds'}`);
      }

      if (newQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Number(newQty.toFixed(3)) } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((count, item) => {
    // For unit-based items we count units, for weight we treat it as 1 item in total count to keep badge clean
    return count + (item.product.sell_type === 'unit' ? item.quantity : 1);
  }, 0);

  const cartTotal = Math.round(
    cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
