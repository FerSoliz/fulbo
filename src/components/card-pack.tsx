'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

const packImageUrl = 'https://i.postimg.cc/qM6GyVNg/sobre-base-campeones-de-qatar.png';

interface CardPackProps {
  onOpen: () => void;
}

export function CardPack({ onOpen }: CardPackProps) {
  const [isOpening, setIsOpening] = useState(false);
  
  const handleOpenPack = () => {
    if (isOpening) return;
    setIsOpening(true);
    onOpen();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
       <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={isOpening ? { scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
            <Image src={packImageUrl} alt="Sobre de cartas" width={300} height={420} priority />
        </motion.div>

      {!isOpening && (
        <Button onClick={handleOpenPack} className="mt-8">
          ABRIR SOBRE
        </Button>
      )}
    </div>
  );
}
