'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getProducts } from '@/lib/firebase/db/products';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductCardSkeleton } from '@/components/product-card-skeleton';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const initialStoreSet = useRef(false);
  const isMobile = useIsMobile();

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

    setTimeout(fetchProducts, 1500);
  }, [toast]);

  const stores = useMemo(() => {
    const storeSet = new Set(products.map(p => p.tienda).filter(Boolean) as string[]);
    return [...Array.from(storeSet), 'Todos'];
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

  const renderableProducts = useMemo(() => {
    if (!isMobile || !expandedProductId) {
        return filteredProducts;
    }

    const expandedIndex = filteredProducts.findIndex(p => p.id === expandedProductId);

    if (expandedIndex <= 0) {
        return filteredProducts;
    }

    const isRightCard = expandedIndex % 2 !== 0;

    if (isRightCard) {
        const newProducts = [...filteredProducts];
        const previousCard = newProducts[expandedIndex - 1];
        newProducts[expandedIndex - 1] = newProducts[expandedIndex];
        newProducts[expandedIndex] = previousCard;
        return newProducts;
    }

    return filteredProducts;
  }, [filteredProducts, expandedProductId, isMobile]);

  const tabsListStyle = {
    backgroundColor: 'rgba(41, 46, 56, 0.4)',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tighter">
            <div className="inline-block origin-left scale-x-[.70]">
                <span className="text-accent-red">SUD</span>STORE
            </div>
          </h1>
        </header>

        {!loading && stores.length > 1 && (
          <Tabs value={selectedStore} onValueChange={setSelectedStore} className="w-full mb-8">
            <TabsList 
              className="grid w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] rounded-lg p-1.5 gap-1 border border-border-soft"
              style={tabsListStyle}
            >
              {stores.map((storeName) => (
                <TabsTrigger
                  key={storeName}
                  value={storeName}
                  className={cn(
                    'py-1.5 transition-all duration-200 border-b-2 rounded-md uppercase text-sm bg-transparent',
                    selectedStore === storeName
                      ? 'font-bold text-amber-400 border-accent-red'
                      : 'text-muted-foreground border-transparent hover:text-amber-400'
                  )}
                >
                  {storeName}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
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
            <p className="mt-2 text-muted-foreground">No se encontraron productos para la tienda seleccionada.</p>
          </div>
        )}

      </div>
    </div>
  );
}
