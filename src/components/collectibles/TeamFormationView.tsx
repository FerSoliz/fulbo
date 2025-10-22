
'use client';

import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TeamFormationViewProps {
  userCollection: CardType[];
  team: any; // Se podría definir un tipo más específico
  onTeamChange: (team: any) => void;
  onViewChange: (view: 'menu') => void;
  onSave: () => void;
}

export const TeamFormationView = ({ userCollection, team, onTeamChange, onViewChange, onSave }: TeamFormationViewProps) => {

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    let newUserTeam = JSON.parse(JSON.stringify(team)); // Deep copy
    let newCollection = [...userCollection];

    // Mover carta de la colección al equipo
    if (sourceListId === 'collectionDroppable') {
      const draggedCard = newCollection.splice(source.index, 1)[0];

      if (destListId.startsWith('starter-')) {
        const starterIndex = parseInt(destListId.split('-')[1]);
        const existingCard = newUserTeam.formation.starters[starterIndex];
        if (existingCard) newCollection.push(existingCard);
        newUserTeam.formation.starters[starterIndex] = draggedCard;
      } else if (destListId.startsWith('sub-')) {
        const subIndex = parseInt(destListId.split('-')[1]);
        const existingCard = newUserTeam.formation.subs[subIndex];
        if (existingCard) newCollection.push(existingCard);
        newUserTeam.formation.subs[subIndex] = draggedCard;
      }
    } 
    // Mover carta del equipo a la colección
    else if (destination.droppableId === 'collectionDroppable') {
      let cardToReturn: CardType | null = null;
      if (sourceListId.startsWith('starter-')) {
        const starterIndex = parseInt(sourceListId.split('-')[1]);
        cardToReturn = newUserTeam.formation.starters[starterIndex];
        newUserTeam.formation.starters[starterIndex] = null;
      } else if (sourceListId.startsWith('sub-')) {
        const subIndex = parseInt(sourceListId.split('-')[1]);
        cardToReturn = newUserTeam.formation.subs[subIndex];
        newUserTeam.formation.subs[subIndex] = null;
      }
      if (cardToReturn) {
        newCollection.splice(destination.index, 0, cardToReturn);
      }
    } 
    // Mover carta dentro del equipo (intercambiar posiciones)
    else {
      let sourceCard: CardType | null = null;
      if (source.droppableId.startsWith('starter-')) {
        sourceCard = newUserTeam.formation.starters[parseInt(source.droppableId.split('-')[1])];
      } else if (source.droppableId.startsWith('sub-')) {
        sourceCard = newUserTeam.formation.subs[parseInt(source.droppableId.split('-')[1])];
      }

      let destCard: CardType | null = null;
      if (destination.droppableId.startsWith('starter-')) {
        destCard = newUserTeam.formation.starters[parseInt(destination.droppableId.split('-')[1])];
      } else if (destination.droppableId.startsWith('sub-')) {
        destCard = newUserTeam.formation.subs[parseInt(destination.droppableId.split('-')[1])];
      }

      if (source.droppableId.startsWith('starter-')) {
        newUserTeam.formation.starters[parseInt(source.droppableId.split('-')[1])] = destCard;
      } else if (source.droppableId.startsWith('sub-')) {
        newUserTeam.formation.subs[parseInt(source.droppableId.split('-')[1])] = destCard;
      }

      if (destination.droppableId.startsWith('starter-')) {
        newUserTeam.formation.starters[parseInt(destination.droppableId.split('-')[1])] = sourceCard;
      } else if (destination.droppableId.startsWith('sub-')) {
        newUserTeam.formation.subs[parseInt(destination.droppableId.split('-')[1])] = sourceCard;
      }
    }
    
    onTeamChange(newUserTeam);
  };

  const availableCards = userCollection.filter(
    (card) => ![...(team.formation.starters || []), ...(team.formation.subs || [])].some((teamCard) => teamCard?.id === card.id)
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex justify-between items-center">
            <Button onClick={() => onViewChange('menu')} variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            <h1 className="text-xl font-bold">Arma tu Equipo</h1>
            <Button onClick={onSave} size="sm">Guardar</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Droppable droppableId="collectionDroppable">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="lg:col-span-1 bg-card/50 p-4 rounded-lg h-[600px] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Disponibles</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableCards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <CollectibleCard card={card} small />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>

          <div className="lg:col-span-2 bg-green-800/20 p-4 rounded-lg border-2 border-dashed border-gray-400">
            <h3 className="font-semibold mb-2 text-center">TITULARES</h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {(team.formation.starters || []).map((card: CardType | null, index: number) => (
                <Droppable key={`starter-${index}`} droppableId={`starter-${index}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn("h-48 bg-black/20 rounded-md flex items-center justify-center border-2 border-dashed", snapshot.isDraggingOver ? "border-yellow-400" : "border-gray-500")}
                    >
                      {card ? (
                        <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CollectibleCard card={card} small />
                            </div>
                          )}
                        </Draggable>
                      ) : <span className="text-xs text-gray-400">Vacío</span>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>

            <h3 className="font-semibold mb-2 text-center">SUPLENTES</h3>
            <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
              {(team.formation.subs || []).map((card: CardType | null, index: number) => (
                <Droppable key={`sub-${index}`} droppableId={`sub-${index}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn("h-48 bg-black/20 rounded-md flex items-center justify-center border-2 border-dashed", snapshot.isDraggingOver ? "border-yellow-400" : "border-gray-500")}
                    >
                      {card ? (
                        <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <CollectibleCard card={card} small />
                            </div>
                          )}
                        </Draggable>
                      ) : <span className="text-xs text-gray-400">Vacío</span>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};
