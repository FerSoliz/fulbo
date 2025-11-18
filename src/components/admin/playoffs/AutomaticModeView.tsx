
'use client';

import { Round } from "@/lib/types";
import { RoundColumn } from "./RoundColumn";

interface AutomaticModeViewProps {
  autoRounds: Round[];
  isEditMode: boolean;
}

export const AutomaticModeView = ({ autoRounds, isEditMode }: AutomaticModeViewProps) => {
  return (
    <div className="flex-grow p-1 sm:p-6 rounded-lg bg-primary/20 overflow-auto">
      {autoRounds.length > 0 ? (
        <div className="flex items-stretch">
          {autoRounds.map((round, index) => (
            <div key={round.title} className="flex items-center">
              <RoundColumn 
                round={round} 
                roundIndex={index} 
                isDraggable={isEditMode && index === 0} // Solo la primera ronda es editable
              />
              {index < autoRounds.length - 1 && <div className="w-4 sm:w-12 h-full" />} 
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p>Selecciona un formato para ver el árbol.</p>
        </div>
      )}
    </div>
  );
};
