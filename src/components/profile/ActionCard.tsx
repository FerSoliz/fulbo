'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import React from 'react';

interface ActionCardProps {
  title: string;
  onClick: () => void;
  secondaryBgImage?: string; // Prop opcional para la segunda imagen
}

export const ActionCard = ({ title, onClick, secondaryBgImage }: ActionCardProps) => {
  // Construcción dinámica de los estilos de fondo
  const style: React.CSSProperties = {
    backgroundImage: secondaryBgImage
      ? `url('${secondaryBgImage}'), url('/assets/profile/puntos.png')`
      : "url('/assets/profile/puntos.png')",
    backgroundSize: secondaryBgImage
      ? 'auto 100%, 300%'
      : '300%',
    backgroundPosition: secondaryBgImage
      ? 'right, center'
      : 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer h-full"
      onClick={onClick}
    >
      <Card
        className="relative rounded-none h-full overflow-hidden"
        style={style}
      >
        <CardTitle className="absolute bottom-[1px] left-[1px] transform origin-left scale-x-50 uppercase italic text-3xl tracking-wider font-bold leading-none">
          {title}
        </CardTitle>
      </Card>
    </motion.div>
  );
};
