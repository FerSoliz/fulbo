'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/firebase/db/products';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ProductDataTable } from '@/components/admin/product-data-table';
import { ProductEditDialog } from '@/components/admin/product-edit-dialog';
import { canManageStore, hasRole } from '@/lib/auth/roles';

export default function AdminStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();
  
  const { user: currentUser, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && (!currentUser || !canManageStore(currentUser))) {
        router.replace('/');
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    if (currentUser && canManageStore(currentUser)) {
        const fetchProducts = async () => {
          setLoading(true);
          try {
              const fetchedProducts = await getProducts();
              setProducts(fetchedProducts);
          } catch (error) {
              console.error(error);
              toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
          } finally {
              setLoading(false);
          }
        };
        fetchProducts();
    }
  }, [currentUser, toast]);

  // REFACTOR: Filtrar productos según el USERNAME del vendedor
  const visibleProducts = useMemo(() => {
    if (!currentUser) return [];
    if (hasRole(currentUser, 'organizador')) {
      return products.filter(p => p.tienda === currentUser.username);
    }
    return products; // El admin ve todo
  }, [products, currentUser]);

  const handleOpenDialog = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsDialogOpen(true);
  };

  const handleSave = async (productData: Omit<Product, 'id'> & { id?: string }) => {
    try {
      let savedProduct: Product;
      if (productToEdit && productData.id) {
        await updateProduct(productData.id, productData);
        savedProduct = { ...productToEdit, ...productData } as Product;
        setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
        toast({ title: 'Éxito', description: 'Producto actualizado correctamente.' });
      } else {
        savedProduct = await createProduct(productData as Omit<Product, 'id'>);
        setProducts([...products, savedProduct]);
        toast({ title: 'Éxito', description: 'Producto creado correctamente.' });
      }
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo guardar el producto.', variant: 'destructive' });
      return false;
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: 'Éxito', description: 'Producto eliminado.', variant: 'destructive' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
    }
  };

  if (userLoading || !currentUser || !canManageStore(currentUser)) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Gestión de la Tienda</h1>
            {/* REFACTOR: Mostrar el username en el subtítulo */}
            <p className="text-muted-foreground mt-1">
              {hasRole(currentUser, 'organizador') ? `Mostrando productos de la tienda: @${currentUser.username}` : 'Añade, edita o elimina productos de la SUDSTORE.'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Producto
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ProductDataTable 
            products={visibleProducts}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        )}

        <ProductEditDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          productToEdit={productToEdit}
          currentUser={currentUser}
        />
      </div>
  );
}
