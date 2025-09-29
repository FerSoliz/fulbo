
'use client';

import { leagues } from '@/lib/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DivisionBadgeProps {
  league: string;
  division: number;
}

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

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold'
      )}
      style={{ backgroundColor: `${leagueInfo.color}20`, color: leagueInfo.color }}
    >
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: leagueInfo.color }}/>
      <span className="uppercase">{leagueInfo.name}</span>
      <span className="font-bold">{romanDivision}</span>
    </div>
  );
}
