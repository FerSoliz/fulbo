
'use client';

import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/types';
import { Handshake, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TransferStatusBadgeProps {
  user: UserProfile;
  onTransferClick: () => void;
}

export const TransferStatusBadge = ({ user, onTransferClick }: TransferStatusBadgeProps) => {
  const { transferStatus } = user;
  if (!transferStatus) return null;

  const statusConfig = {
    libre: { text: 'LIBRE', color: 'bg-green-500' },
    traspaso: { text: 'TRASPASO', color: 'bg-amber-400' },
    blindado: { text: 'BLINDADO', color: 'bg-red-600' },
  };

  const config = statusConfig[transferStatus];
  const isClickable = transferStatus !== 'blindado';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={isClickable ? onTransferClick : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 text-white font-bold text-xs px-2 py-0.5 rounded-full',
              config.color,
              isClickable && 'cursor-pointer'
            )}
          >
            {isClickable ? <Handshake className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{config.text}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isClickable ? 'Contactar' : 'No acepta ofertas'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
