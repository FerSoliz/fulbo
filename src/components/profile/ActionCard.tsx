'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  title: string;
  onClick: () => void;
  secondaryBgImage?: string;
  disabled?: boolean;
  badge?: string;
}

export const ActionCard = ({ title, onClick, secondaryBgImage, disabled, badge }: ActionCardProps) => {
  const style: React.CSSProperties = {
    backgroundImage: secondaryBgImage
      ? `url('${secondaryBgImage}'), url('/assets/profile/puntos.png')`
      : "url('/assets/profile/puntos.png')",
    backgroundSize: secondaryBgImage ? 'auto 100%, 300%' : '300%',
    backgroundPosition: secondaryBgImage ? 'right, center' : 'center',
    backgroundRepeat: 'no-repeat',
  };

  const handleCardClick = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn('h-full', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      onClick={handleCardClick}
    >
      <Card
        className={cn(
          'relative rounded-none h-full overflow-hidden transition-all'
        )}
        style={style}
      >
        {badge && (
          <div className="absolute top-1 right-1 bg-accent-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            {badge}
          </div>
        )}
        <CardTitle className="absolute bottom-[1px] left-[1px] transform origin-left scale-x-50 uppercase italic text-3xl tracking-wider font-bold leading-none">
          {title}
        </CardTitle>
      </Card>
    </motion.div>
  );
};
