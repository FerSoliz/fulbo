import { z } from "zod";

// Esquema para la creación/edición de publicaciones
export const createPostSchema = z
  .object({
    content: z.string().max(280, {
      message: "El contenido no puede exceder los 280 caracteres.",
    }).optional(),
    files: z.array(z.string().url()).optional().default([]),
    authorId: z.string().min(1),
    tournamentId: z.string().optional(),
    isPinned: z.boolean().default(false),
  })
  .refine(data => {
      const hasTextContent = (data.content || '').trim().length > 0;
      const hasFiles = data.files && data.files.length > 0;
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
      const twitchRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/;
      const hasVideoLink = youtubeRegex.test(data.content || '') || twitchRegex.test(data.content || '');

  return hasTextContent || hasFiles || hasVideoLink;
  }, {
    message: "Tu publicación no puede estar vacía. Añade texto, una o más imágenes, o un enlace de YouTube/Twitch.",
  });
  
export type CreatePostInput = z.infer<typeof createPostSchema>;

// --- NUEVO ESQUEMA: Validación para el Formulario de Registro ---
export const registerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }),
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  /**
   * El DNI se valida como un string por varias razones clave:
   * 1.  **Conservación de ceros iniciales:** Si un DNI comenzara con '0', un tipo 'number' lo eliminaría.
   * 2.  **Flexibilidad futura:** Permite adaptarse a identificadores que puedan incluir letras (ej. pasaportes).
   * 3.  **Consistencia:** Los inputs de formularios HTML siempre devuelven strings.
   * La validación `.regex(/^\d+$/)` asegura que, aunque sea un string, solo contenga caracteres numéricos.
   */
  dni: z.string()
    .min(8, { message: "El DNI debe tener exactamente 8 dígitos." })
    .max(8, { message: "El DNI debe tener exactamente 8 dígitos." })
    .regex(/^\d+$/, { message: "El DNI solo puede contener números." }),
  // El URL del fondo seleccionado no lo validamos con Zod aquí, ya que se selecciona de una lista predefinida.
});

export type RegisterInput = z.infer<typeof registerSchema>;
