
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
    traspaso: { text: 'TRASPASO', color: 'bg-yellow-500' },
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
              'flex items-center gap-2 text-white font-bold text-xs px-3 py-1 rounded-full',
              config.color,
              isClickable && 'cursor-pointer'
            )}
          >
            {isClickable ? <Handshake className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
