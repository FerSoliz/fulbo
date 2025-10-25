'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ActionCardProps {
  title: string;
  onClick: () => void;
}

export const ActionCard = ({ title, onClick }: ActionCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer h-full"
      onClick={onClick}
    >
      {/* 
        - Ajuste de Zoom: Se incrementa el `backgroundSize` a '300%' para un efecto más pronunciado.
      */}
      <Card 
        className="relative rounded-none h-full overflow-hidden bg-center"
        style={{
          backgroundImage: "url('/assets/profile/puntos.png')",
          backgroundSize: '300%', 
        }}
      >
        <CardTitle className="absolute bottom-[1px] left-[1px] transform origin-left scale-x-50 uppercase italic text-3xl tracking-wider font-bold leading-none">
          {title}
        </CardTitle>
      </Card>
    </motion.div>
  );
};
