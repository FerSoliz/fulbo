'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/firebase/db';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

    fetchProducts();
  }, [toast]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter">SUDSTORE</h1>
          <p className="text-muted-foreground mt-2">El merchandising oficial de la comunidad SudOne.</p>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Cargando productos...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                  key={product.id} 
                  product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">Próximamente</h2>
            <p className="mt-2 text-muted-foreground">Aún no hay productos en la tienda. ¡Vuelve pronto!</p>
          </div>
        )}
      </div>
    </div>
  );
}
