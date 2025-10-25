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
      <Card className="relative rounded-none bg-container hover:bg-container/80 transition-colors h-full overflow-hidden">
        {/*
          - Se usa un valor negativo en 'bottom' para forzar el texto hacia abajo.
          - Esto contrarresta las métricas internas de la fuente y elimina la "flotación".
        */}
        <CardTitle className="absolute bottom-[-2px] left-[1px] transform origin-left scale-x-50 uppercase italic text-3xl tracking-wider font-bold leading-none">
          {title}
        </CardTitle>
      </Card>
    </motion.div>
  );
};
