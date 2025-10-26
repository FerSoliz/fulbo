'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getProducts } from '@/lib/firebase/db';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { useToast } from '@/hooks/use-toast';
import { ProductCardSkeleton } from '@/components/product-card-skeleton';
import { StoreFilters } from '@/components/store-filters';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('Todos');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const initialStoreSet = useRef(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
        toast({
            title: "Error al cargar productos",
            description: "No se pudieron obtener los productos. Intenta de nuevo más tarde.",
            variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    // Simulate loading for demonstration purposes
    setTimeout(fetchProducts, 1500);
  }, [toast]);

  const stores = useMemo(() => {
    const storeSet = new Set(products.map(p => p.tienda).filter(Boolean) as string[]);
    return Array.from(storeSet);
  }, [products]);

  useEffect(() => {
    if (stores.length > 0 && !initialStoreSet.current) {
        setSelectedStore(stores[0]);
        initialStoreSet.current = true;
    }
  }, [stores]);

  const handleToggleDetails = (productId: string) => {
    setExpandedProductId(prevId => (prevId === productId ? null : productId));
  };

  const filteredProducts = useMemo(() => {
    if (selectedStore === 'Todos') {
      return products;
    }
    return products.filter(p => p.tienda === selectedStore);
  }, [products, selectedStore]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter">SUDSTORE</h1>
          <p className="text-muted-foreground mt-2">El merchandising oficial de la comunidad SudOne.</p>
        </header>

        {!loading && stores.length > 0 && (
          <StoreFilters 
            stores={stores}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                  key={product.id} 
                  product={product}
                  isExpanded={expandedProductId === product.id}
                  onToggleDetails={() => handleToggleDetails(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">No hay productos</h2>
            <p className="mt-2 text-muted-foreground">No se encontraron productos que coincidan con el filtro seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
