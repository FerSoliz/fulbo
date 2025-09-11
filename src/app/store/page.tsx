
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { AddProductDialog } from '@/components/add-product-dialog';
import { Product, User, initialProducts } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function StorePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }

    const deletedProducts = JSON.parse(localStorage.getItem('deleted_products') || '[]');
    const availableInitialProducts = initialProducts.filter(p => !deletedProducts.includes(p.id));
    
    const customProducts = JSON.parse(localStorage.getItem('products_v2') || '[]');
    setProducts([...availableInitialProducts, ...customProducts]);

  }, []);

  const handleSaveProduct = (productData: Product) => {
    let updatedProducts: Product[];
    if (productToEdit) { // Editing existing product
        updatedProducts = products.map(p => p.id === productData.id ? productData : p);
    } else { // Adding new product
        updatedProducts = [...products, productData];
    }
    
    setProducts(updatedProducts);

    // Persist only non-initial products to localStorage
    const customProducts = updatedProducts.filter(p => !p.isInitial);
    localStorage.setItem('products_v2', JSON.stringify(customProducts));

    setProductToEdit(null);
    toast({
        title: '¡Éxito!',
        description: `El producto "${productData.name}" se ha guardado correctamente.`,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    // If it's an initial product, add its ID to a "deleted" list
    // Otherwise, filter it out from custom products
    if(productToDelete.isInitial) {
        const deletedProducts = JSON.parse(localStorage.getItem('deleted_products') || '[]');
        localStorage.setItem('deleted_products', JSON.stringify([...deletedProducts, productId]));
    } else {
        const customProducts = JSON.parse(localStorage.getItem('products_v2') || '[]')
        const updatedCustomProducts = customProducts.filter((p: Product) => p.id !== productId);
        localStorage.setItem('products_v2', JSON.stringify(updatedCustomProducts));
    }
    
    setProducts(products.filter(p => p.id !== productId));
    
    toast({
        title: 'Producto Eliminado',
        description: `El producto "${productToDelete.name}" ha sido eliminado.`,
        variant: 'destructive',
    });
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
