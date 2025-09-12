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
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
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
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e: any) {
            console.error("URL fetch error:", e);
            reject(e);
          }
        }
      );
    });
  };
  
  const uploadMultipleFiles = async (files: File[], path: string): Promise<string[]> => {
      setIsUploading(true);
      setProgress(0);
      
      const promises = files.map(async (file, index) => {
          try {
              const url = await uploadFile(file, path);
              // Calculate progress for multiple files
              setProgress(((index + 1) / files.length) * 100);
              return url;
          } catch (error) {
              console.error(`Failed to upload ${file.name}`, error);
              return null; // Return null for failed uploads
          }
      });
      
      try {
        const results = await Promise.all(promises);
        const successfulUrls = results.filter((url): url is string => url !== null);
        
        if (successfulUrls.length === files.length) {
            toast({
              title: '¡Subida Exitosa!',
              description: `${files.length} imagen(es) subida(s) correctamente.`,
            });
        } else {
             toast({
              title: 'Subida Parcial',
              description: `${successfulUrls.length} de ${files.length} imágenes se subieron.`,
              variant: 'destructive',
            });
        }
        return successfulUrls;

      } catch (error: any) {
        toast({
          title: 'Error de Subida Múltiple',
          description: 'Algunos archivos no se pudieron subir.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
  }

  return { isUploading, progress, uploadFile, uploadMultipleFiles };
}
