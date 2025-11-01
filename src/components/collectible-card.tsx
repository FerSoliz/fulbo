'use client';
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/collectible-cards-data';
import { cn } from '@/lib/utils';

interface CollectibleCardProps {
  card: CardType;
  small?: boolean;
}

export function CollectibleCard({ card, small = false }: CollectibleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || small) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = cardElement.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 25;
      const y = (e.clientY - top - height / 2) / 25;
      cardElement.style.transform = `rotateY(${x}deg) rotateX(${-y}deg) scale(1.05)`;

      const holoBefore = cardElement.querySelector('.holographic::before') as HTMLElement;
       if (holoBefore) {
        const bgX = (e.clientX - left) / width * 100;
        const bgY = (e.clientY - top) / height * 100;
        holoBefore.style.backgroundPosition = `${bgX}% ${bgY}%`;
      }
    };
    
    const handleMouseLeave = () => {
      if (cardElement) {
        cardElement.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
      }
    };

    cardElement.addEventListener('mousemove', handleMouseMove);
    cardElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cardElement.removeEventListener('mousemove', handleMouseMove);
      cardElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [small]);

  // Aumento significativo para las cartas no pequeñas
  const width = small ? 144 : 312; // 208 * 1.5 = 312
  const height = small ? 225 : 488; // 325 * 1.5 = 487.5 => 488

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative transition-transform duration-100 ease-out',
        !small && 'perspective-1000 transform-style-preserve-3d'
      )}
      style={{ 
        width: `${width}px`,
        height: `${height}px`,
       }}
    >
      <Image
        src={card.playerImageUrl}
        alt={card.name}
        width={width}
        height={height}
        className={cn(
            'rounded-lg w-full h-full object-cover',
            card.rarity !== 'common' && 'holographic'
        )}
        data-rarity={card.rarity.toLowerCase()}
        priority
      />
    </div>
  );
}
