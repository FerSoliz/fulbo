'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, collection, setDoc, doc } from '@/lib/firebase';
import { auth } from '@/lib/firebase'; // Import auth to get current user

// 1. Definimos el Schema de validación con Zod
const PostSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  content: z.string().min(10, { message: 'El contenido debe tener al menos 10 caracteres.' }),
});

export type State = {
  errors?: {
    title?: string[];
    content?: string[];
  };
  message?: string | null;
};

// 2. Creamos la Server Action
export async function createPost(prevState: State, formData: FormData) {
  // --- (Paso Crítico de Seguridad - Lo implementaremos a fondo después) ---
  // Aquí, en un entorno de producción real, verificaríamos el token del usuario.
  // Por ahora, asumimos que la UI ya ha validado que el usuario es admin.
  // const user = auth.currentUser; -> Esto no funciona en el servidor directamente
  // ¡No te preocupes! Abordaremos la seguridad del servidor en el siguiente paso.

  // 3. Validamos los datos del formulario con Zod
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  // Si la validación falla, devolvemos los errores para que el formulario los muestre
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Por favor, revisa los campos.',
    };
  }

  const { title, content } = validatedFields.data;

  try {
    // 4. Creamos un nuevo documento en la colección 'posts' de Firestore
    const newPostRef = doc(collection(db, 'posts'));
    
    await setDoc(newPostRef, {
      id: newPostRef.id,
      title,
      content,
      authorId: 'admin_placeholder', // Placeholder - Lo cambiaremos por el ID real del admin
      authorName: 'Admin SudOne', // Placeholder
      createdAt: new Date(),
      likes: [],
      commentsCount: 0,
    });

  } catch (e) {
    // 5. Manejamos cualquier error que ocurra durante la escritura en la base de datos
    return {
      message: 'Error en la base de datos: No se pudo crear el post.',
    };
  }

  // 6. Si todo sale bien, revalidamos la cache de la página del feed y redirigimos (o mostramos mensaje de éxito)
  // revalidatePath('/'); // Esto limpiará la cache para que todos vean el nuevo post
  return {
    message: `Post "${title}" creado con éxito.`,
  };
}