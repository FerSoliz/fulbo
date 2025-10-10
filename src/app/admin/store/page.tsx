'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/firebase/db';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ProductDataTable } from '@/components/admin/product-data-table';
import { ProductEditDialog } from '@/components/admin/product-edit-dialog';

export default function AdminStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();
  
  const { user: currentUser, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor'))) {
        router.replace('/');
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    if(currentUser) { // Solo cargar productos si el usuario está autenticado
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

  const handleOpenDialog = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsDialogOpen(true);
  };

  const handleSave = async (productData: Omit<Product, 'id'> & { id?: string }) => {
    try {
      if (productToEdit && productData.id) {
        await updateProduct(productData.id, productData);
        setProducts(products.map(p => p.id === productData.id ? { ...p, ...productData } as Product : p));
        toast({ title: 'Éxito', description: 'Producto actualizado correctamente.' });
      } else {
        const newProduct = await createProduct(productData as Omit<Product, 'id'>);
        setProducts([...products, newProduct]);
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

  if (userLoading || !currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Gestión de la Tienda</h1>
            <p className="text-muted-foreground mt-1">Añade, edita o elimina productos de la SUDSTORE.</p>
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
            products={products}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        )}

        <ProductEditDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          productToEdit={productToEdit}
        />
      </div>
  );
}
