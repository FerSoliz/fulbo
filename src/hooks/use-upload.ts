'use client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  const compressImageToDataUrl = async (file: File): Promise<string> => {
    const imageDataUrl = await fileToDataUrl(file);
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      image.src = imageDataUrl;
    });

    const MAX_SIDE = 1280;
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(image.width * scale));
    canvas.height = Math.max(1, Math.floor(image.height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return imageDataUrl;
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  }

  const uploadFile = async (file: File, _path: string): Promise<string> => {
    setIsUploading(true);
    setProgress(0);

    try {
      setProgress(35);
      const dataUrl = file.type.startsWith('image/')
        ? await compressImageToDataUrl(file)
        : await fileToDataUrl(file);
      setProgress(100);
      return dataUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error de Subida',
        description: 'Hubo un problema al procesar el archivo.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  const uploadMultipleFiles = async (files: File[], path: string): Promise<string[]> => {
      setIsUploading(true);
      setProgress(0);
      
      try {
        const successfulUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          try {
            const url = await uploadFile(files[i], path);
            successfulUrls.push(url);
          } catch (error) {
            console.error(`Error procesando ${files[i].name}:`, error);
          }
          setProgress(((i + 1) / files.length) * 100);
        }
        
        if (successfulUrls.length === files.length) {
            toast({
              title: '¡Subida Exitosa!',
              description: `${files.length} imagen(es) subida(s) correctamente.`,
            });
        } else {
             toast({
              title: 'Subida Parcial',
              description: `${successfulUrls.length} de ${files.length} imágenes se subieron. Algunas pueden haber fallado.`,
              variant: 'destructive',
            });
        }
        return successfulUrls;

      } catch (error) {
        toast({
          title: 'Error de Subida Múltiple',
          description: 'Ocurrió un error inesperado durante el proceso.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
  }

  return { isUploading, progress, uploadFile, uploadMultipleFiles, fileToDataUrl };
}
