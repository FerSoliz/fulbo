import { ref, get, set, update, remove, push } from 'firebase/database';
import { db } from '../../firebase';
import { Product } from '../../types';

/**
 * Obtiene todos los productos disponibles en la tienda.
 * @returns Una promesa que se resuelve con un array de Product.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron productos en la tienda.");
      return [];
    }

    const productsList: Product[] = [];
    snapshot.forEach(childSnapshot => {
      productsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return productsList;

  } catch (error) {
    console.error("[DB Service] Error crítico al obtener los productos de la tienda:", error);
    return [];
  }
};

/**
 * Crea un nuevo producto en la tienda.
 * @param productData Los datos del nuevo producto (excluyendo el ID, que será generado por Firebase).
 * @returns Una promesa que se resuelve con el objeto Product creado, incluyendo su ID.
 */
export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef);
  const newProduct: Product = {
    ...productData,
    id: newProductRef.key!,
  };
  await set(newProductRef, productData);
  return newProduct;
};

/**
 * Actualiza un producto existente en la tienda.
 * @param productId El ID del producto a actualizar.
 * @param updates Un objeto con las propiedades a actualizar del producto.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const productRef = ref(db, `products/${productId}`);
  await update(productRef, updates);
};

/**
 * Elimina un producto de la tienda.
 * @param productId El ID del producto a eliminar.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = ref(db, `products/${productId}`);
  await remove(productRef);
};
