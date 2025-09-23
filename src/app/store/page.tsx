'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { AddProductDialog } from '@/components/add-product-dialog';
import { Product, User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';


export default function StorePage() {
  const { user: currentUser } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => doc.data() as Product);
        setProducts(productsData);
    } catch (error) {
        console.error("Error fetching products: ", error);
        toast({
            title: "Error al cargar productos",
            description: "No se pudieron obtener los productos desde la base de datos.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (productData: Product) => {
    try {
        const productRef = doc(db, 'products', productData.id);
        await setDoc(productRef, productData, { merge: true });

        if (productToEdit) {
            setProducts(products.map(p => p.id === productData.id ? productData : p));
        } else {
            setProducts([...products, productData]);
        }
        
        setProductToEdit(null);
        toast({
            title: '¡Éxito!',
            description: `El producto "${productData.name}" se ha guardado correctamente.`,
        });
    } catch (error) {
        console.error("Error saving product: ", error);
        toast({
          title: "Error al guardar",
          description: "Hubo un problema al guardar el producto.",
          variant: "destructive"
        });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(p => p.id !== productId));
        toast({
            title: 'Producto Eliminado',
            description: `El producto "${productToDelete.name}" ha sido eliminado.`,
            variant: 'destructive',
        });
    } catch (error) {
        console.error("Error deleting product: ", error);
        toast({
          title: "Error al eliminar",
          description: "Hubo un problema al eliminar el producto.",
          variant: "destructive"
        });
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsAddDialogOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    setProductToEdit(null);
    setIsAddDialogOpen(true);
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter">SUDSTORE</h1>
          {isAdmin && (
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          )}
        </div>
        {loading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-4">Cargando productos...</span>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteProduct}
                    onEdit={handleEditProduct}
                />
            ))}
            </div>
        )}
      </div>
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />
    </div>
  );
}
