import { z } from "zod";

// 1. Empezamos definiendo el esquema para una nueva publicación.
//    Utilizamos Zod para asegurarnos de que los datos de entrada sean exactamente como los esperamos.
export const createPostSchema = z
  .object({
    /**
     * El contenido de texto de la publicación. Es un string que debe tener como máximo
     * 280 caracteres, similar a Twitter. Se permite que esté vacío si se adjuntan archivos o videos.
     */
    content: z.string().max(280, {
      message: "El contenido no puede exceder los 280 caracteres.",
    }).optional(), // <--- Ahora es opcional

    /**
     * Un array de URLs de archivos adjuntos (imágenes o videos). Es opcional y por
     * defecto es un array vacío.
     */
    files: z.array(z.string().url()).optional().default([]),

    /**
     * El ID del autor de la publicación. Es un string no vacío.
     */
    authorId: z.string().min(1),

    /**
     * Opcionalmente, el ID del torneo al que está asociada la publicación.
     */
    tournamentId: z.string().optional(),

    /**
     * Indica si la publicación debe ser fijada. Es un booleano que por defecto es `false`.
     */
    isPinned: z.boolean().default(false),
  })
  // 3. Añadimos una validación a nivel del objeto completo (refine).
  //    Esta validación general asegura que *algo* de contenido esté presente en la publicación.
  .refine(data => {
      // Una publicación es válida si tiene:
      // 1. Contenido de texto real (después de eliminar espacios), O
      // 2. Archivos adjuntos (imágenes), O
      // 3. Un enlace válido de video (YouTube o Twitch) dentro del texto.
      const hasTextContent = (data.content || '').trim().length > 0; // Añadimos || '' para manejar undefined
      const hasFiles = data.files && data.files.length > 0;
      
      // Usamos regex para detectar enlaces de video directamente en el contenido
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
      const twitchRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/;
      const hasVideoLink = youtubeRegex.test(data.content || '') || twitchRegex.test(data.content || ''); // Añadimos || ''

  return hasTextContent || hasFiles || hasVideoLink;
  }, {
    // 4. Si la validación 'refine' falla, se usará este mensaje de error más específico.
    message: "Tu publicación no puede estar vacía. Añade texto, una o más imágenes, o un enlace de YouTube/Twitch.",
  });
  
  // 5. Finalmente, inferimos el tipo de TypeScript directamente desde el esquema de Zod.
  //    Esto nos da un tipado fuerte y consistente sin tener que declarar una 'interface' por separado.
  export type CreatePostInput = z.infer<typeof createPostSchema>;
