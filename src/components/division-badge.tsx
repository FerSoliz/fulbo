'use client';

import { leagues } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Shield, Gem, Crown, Star } from 'lucide-react';

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

  const Icon = ICONS[leagueInfo.icon] || Star;
  const romanDivision = romanNumerals[division] || division;

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
