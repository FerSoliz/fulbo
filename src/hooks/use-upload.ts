'use client';
import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File, path: string): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    return new Promise((resolve, reject) => {
      // FIX: Sanitize the file name to prevent issues with special characters.
      const sanitizedFileName = file.name.replace(/[/\\?%*:|"<>]/g, '_');
      const storageRef = ref(storage, `${path}/${Date.now()}_${sanitizedFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(currentProgress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast({
            title: 'Error de Subida',
            description: 'Hubo un problema al subir el archivo.',
            variant: 'destructive',
          });
          setIsUploading(false);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            resolve(url);
          } catch (e: any) {
            console.error("URL fetch error:", e);
            setIsUploading(false);
            reject(e);
          }
        }
      );
    });
  };
  
  const uploadMultipleFiles = async (files: File[], path: string): Promise<string[]> => {
      setIsUploading(true);
      setProgress(0);
      
      const uploadPromises = files.map((file, index) => 
        new Promise<string | null>((resolve, reject) => {
          // FIX: Sanitize the file name to prevent issues with special characters.
          const sanitizedFileName = file.name.replace(/[/\\?%*:|"<>]/g, '_');
          const storageRef = ref(storage, `${path}/${Date.now()}_${sanitizedFileName}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const overallProgress = ((index + (snapshot.bytesTransferred / snapshot.totalBytes)) / files.length) * 100;
              setProgress(overallProgress);
            },
            (error) => {
              console.error(`Error subiendo ${file.name}:`, error);
              resolve(null); // Resolve with null on error for individual file
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (e) {
                console.error(`Error obteniendo URL for ${file.name}:`, e);
                resolve(null);
              }
            }
          );
        })
      );
      
      try {
        const results = await Promise.all(uploadPromises);
        const successfulUrls = results.filter((url): url is string => url !== null);
        
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

      } catch (error) { // This catch might not be necessary with the current promise setup
        toast({
          title: 'Error de Subida Múltiple',
          description: 'Ocurrió un error inesperado durante la subida.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
  }

  // Converts a file to a base64 Data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  return { isUploading, progress, uploadFile, uploadMultipleFiles, fileToDataUrl };
}
