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
      
      try {
        const uploadPromises = files.map(file => uploadFile(file, path));
        const urls = await Promise.all(uploadPromises);
        toast({
          title: '¡Subida Exitosa!',
          description: `${files.length} imagen(es) subida(s) correctamente.`,
        });
        return urls;
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

  return { isUploading, progress, uploadMultipleFiles };
}
