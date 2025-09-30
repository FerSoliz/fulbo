'use client';

import React, { useState } from 'react';
import { db, collection, addDoc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TempFirestoreTest() {
  const [testValue, setTestValue] = useState('');
  const { toast } = useToast();

  const handleAddTestDoc = async () => {
    if (!testValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce un valor para la prueba.",
        variant: "destructive",
      });
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "test_collection"), {
        testField: testValue,
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Éxito de prueba",
        description: `Documento de prueba añadido con ID: ${docRef.id}`,
        duration: 5000,
      });
      console.log("TEST: Documento de prueba añadido con ID:", docRef.id);
      setTestValue('');
    } catch (error: any) {
      console.error("TEST: Error al añadir documento de prueba:", error);
      toast({
        title: "Error de prueba",
        description: `Fallo al añadir documento: ${error.message || 'Desconocido'}`,
        variant: "destructive",
        duration: 9000,
      });
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm mb-4 bg-yellow-50/10 border-yellow-200">
      <h3 className="text-lg font-semibold text-yellow-700">Herramienta de Depuración de Firestore (Temporal)</h3>
      <p className="text-sm text-yellow-600 mb-3">Esto intentará añadir un documento simple a una colección 'test_collection'.</p>
      <div className="flex space-x-2">
        <Input
          placeholder="Introduce texto de prueba..."
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddTestDoc}>Añadir Documento de Prueba</Button>
      </div>
    </div>
  );
}
