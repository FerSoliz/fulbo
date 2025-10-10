'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Define la estructura de un item dentro del carrito
export interface CartItem extends Product {
  quantity: number;
}

// Define la forma del contexto que vamos a proveer
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

// Creamos el contexto con un valor inicial undefined
const CartContext = createContext<CartContextType | undefined>(undefined);

// Creamos el proveedor del contexto
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Si el item ya existe, incrementamos su cantidad
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Si es un item nuevo, lo añadimos al carrito con cantidad 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast({ title: "✅ Producto añadido", description: `${product.name} fue añadido al carrito.` });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    toast({ title: "Producto eliminado", variant: "destructive" });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item => (item.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    toast({ title: "🗑️ Carrito vacío", description: "Todos los productos han sido eliminados." });
  };

  // Calculamos el número total de items en el carrito
  const itemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Calculamos el coste total del carrito
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook personalizado para usar el contexto del carrito fácilmente
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
