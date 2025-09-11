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
    if (!cardElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = cardElement.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 25;
      const y = (e.clientY - top - height / 2) / 25;
      cardElement.style.transform = `rotateY(${x}deg) rotateX(${-y}deg) scale(1.05)`;

      const bgX = (e.clientX - left) / width * 100;
      const bgY = (e.clientY - top) / height * 100;
      const holoEffect = cardElement.querySelector('.holographic::before') as HTMLElement;
      if (holoEffect) {
        holoEffect.style.backgroundPosition = `${bgX}% ${bgY}%`;
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
  }, []);

  const width = small ? 112 : 192;
  const height = small ? 157 : 269;

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative transition-transform duration-100 ease-out preserve-3d',
        small ? 'w-28' : 'w-48'
      )}
      style={{ 
        perspective: '1000px',
        width: `${width}px`,
        height: `${height}px`,
       }}
    >
      <div className="absolute inset-0 holographic rounded-lg overflow-hidden" data-rarity={card.rarity.toLowerCase()}>
        <Image
          src={card.playerImageUrl}
          alt={card.name}
          width={width}
          height={height}
          objectFit="cover"
          className="rounded-lg"
          priority
        />
      </div>
    </div>
  );
}
