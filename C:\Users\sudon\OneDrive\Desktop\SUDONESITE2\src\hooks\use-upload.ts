import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function useUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          setError(error);
          setStatus('error');
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
            setDownloadURL(url);
            setStatus('success');
            resolve(url);
          } catch (e: any) {
            setError(e);
            setStatus('error');
            reject(e);
          }
        }
      );
    });
  };
  
  const uploadMultipleFiles = async (files: File[], path: string): Promise<string[]> => {
      setStatus('uploading');
      const uploadPromises = files.map(file => uploadFile(file, path));
      
      try {
        const urls = await Promise.all(uploadPromises);
        setStatus('success');
        return urls;
      } catch (error: any) {
        setStatus('error');
        setError(error);
        toast({
          title: 'Error de Subida Múltiple',
          description: 'Algunos archivos no se pudieron subir.',
          variant: 'destructive',
        });
        return [];
      }
  }


  return { status, progress, downloadURL, error, uploadFile, uploadMultipleFiles, isUploading: status === 'uploading' };
}
