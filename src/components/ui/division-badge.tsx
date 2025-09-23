
'use client';

import { leagues } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Shield, Gem, Crown, Star } from 'lucide-react';
import Image from 'next/image';

interface DivisionBadgeProps {
  league: string;
  division: number;
}

const ICONS: { [key: string]: React.ElementType } = {
  Shield,
  Gem,
  Crown,
  Star,
};

const romanNumerals: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV'
};

export function DivisionBadge({ league, division }: DivisionBadgeProps) {
  const leagueInfo = leagues.find(l => l.name === league);

  if (!leagueInfo) {
    return null;
  }

  const romanDivision = romanNumerals[division] || division;

  // @ts-ignore
  if (leagueInfo.badgeImageUrl) {
    return (
        <div
            className="relative inline-flex items-center justify-center w-28 h-12"
        >
            <Image
                // @ts-ignore
                src={leagueInfo.badgeImageUrl}
                alt={`${leagueInfo.name} badge`}
                fill
                className="object-contain"
            />
            <span className="relative text-white font-bold text-lg" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
                {romanDivision}
            </span>
        </div>
    )
  }

  const Icon = ICONS[leagueInfo.icon] || Star;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1'
      )}
      style={{ backgroundColor: `${leagueInfo.color}20`, color: leagueInfo.color }}
    >
      <Icon className="h-4 w-4" />
      <span className="font-bold uppercase text-sm">{leagueInfo.name}</span>
      <span className="font-mono text-xs font-bold">{romanDivision}</span>
    </div>
  );
}

