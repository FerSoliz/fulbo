'use client';
import { useState, useEffect, useCallback } from 'react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { CardPack } from '@/components/card-pack';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dices, Shield, Swords, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type View = 'menu' | 'pack' | 'formation' | 'vs_match';

const initialTeam = {
  name: 'Mi Equipo',
  formation: {
    starters: Array(5).fill(null),
    subs: Array(3).fill(null),
  }
};

const botTeamLineup = allCards.sort(() => 0.5 - Math.random()).slice(0, 8);
const botTeam = {
  name: 'Bot Oponente',
  formation: {
    starters: botTeamLineup.slice(0, 5),
    subs: botTeamLineup.slice(5, 8),
  }
}

export default function CollectibleCardsPage() {
  const [view, setView] = useState<View>('menu');
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [userTeam, setUserTeam] = useState(initialTeam);
  const [lastOpenedPack, setLastOpenedPack] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Cargar colección y equipo del localStorage
    const savedCollection = localStorage.getItem('userCardCollection');
    const savedTeam = localStorage.getItem('userCardTeam');

    if (savedCollection) {
      setUserCollection(JSON.parse(savedCollection));
    } else {
       // Dar 5 cartas iniciales aleatorias
       const initialCards = allCards.sort(() => 0.5 - Math.random()).slice(0, 5);
       setUserCollection(initialCards);
       localStorage.setItem('userCardCollection', JSON.stringify(initialCards));
    }

    if (savedTeam) {
      setUserTeam(JSON.parse(savedTeam));
    }
  }, []);

  const saveCollection = (collection: CardType[]) => {
    setUserCollection(collection);
    localStorage.setItem('userCardCollection', JSON.stringify(collection));
  };

  const saveTeam = (team: typeof initialTeam) => {
    setUserTeam(team);
    localStorage.setItem('userCardTeam', JSON.stringify(team));
  }

  const handleOpenPack = () => {
    const newCards = allCards.sort(() => 0.5 - Math.random()).slice(0, 3);
    setLastOpenedPack(newCards);
    const updatedCollection = [...userCollection];
    newCards.forEach(newCard => {
      if (!updatedCollection.some(card => card.id === newCard.id)) {
        updatedCollection.push(newCard);
      }
    });
    saveCollection(updatedCollection);
    setView('pack');
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;
    
    let newUserTeam = { ...userTeam };
    let newCollection = [...userCollection];

    // Mover desde la colección a la formación
    if (sourceListId === 'collectionDroppable') {
      const draggedCard = newCollection[source.index];
      
      if (destListId.startsWith('starter-')) {
        const starterIndex = parseInt(destListId.split('-')[1]);
        if(newUserTeam.formation.starters[starterIndex]) { // si ya hay una carta, la devolvemos a la coleccion
            newCollection.push(newUserTeam.formation.starters[starterIndex]!);
        }
        newUserTeam.formation.starters[starterIndex] = draggedCard;
        newCollection.splice(source.index, 1);
      } else if (destListId.startsWith('sub-')) {
        const subIndex = parseInt(destListId.split('-')[1]);
         if(newUserTeam.formation.subs[subIndex]) { // si ya hay una carta, la devolvemos a la coleccion
            newCollection.push(newUserTeam.formation.subs[subIndex]!);
        }
        newUserTeam.formation.subs[subIndex] = draggedCard;
        newCollection.splice(source.index, 1);
      }
    } 
    // Mover desde la formación a la colección
    else if (destination.droppableId === 'collectionDroppable') {
        let cardToReturn: CardType | null = null;
        if(sourceListId.startsWith('starter-')) {
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
    // Mover dentro de la formación
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

        // Swap cards
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
    
    setUserTeam(newUserTeam);
    setUserCollection(newCollection);
  };
  
  if (!isClient) {
    return <div className="p-4 text-center">Cargando juego de cartas...</div>;
  }

  const renderView = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onOpenPack={handleOpenPack} setView={setView} />;
      case 'pack':
        return <PackOpeningView cards={lastOpenedPack} setView={setView} />;
      case 'formation':
        return (
          <DragDropContext onDragEnd={onDragEnd}>
            <TeamFormationView 
              userCollection={userCollection} 
              team={userTeam} 
              setTeam={saveTeam} 
              setView={setView} 
            />
          </DragDropContext>
        );
      case 'vs_match':
        return <VsMatchSimulation userTeam={userTeam} botTeam={botTeam} setView={setView}/>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-wider uppercase">Cartas Coleccionables</h1>
        {renderView()}
      </div>
    </div>
  );
}

const MainMenu = ({ onOpenPack, setView }: { onOpenPack: () => void, setView: (v: View) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
    <button onClick={onOpenPack} className="bg-primary/80 hover:bg-primary rounded-lg p-8 transition-all transform hover:scale-105">
      <h2 className="text-2xl font-bold">ABRIR SOBRE</h2>
      <p className="text-muted-foreground">Consigue nuevas cartas</p>
    </button>
    <Link href="/collectibles/collection" className="bg-secondary/80 hover:bg-secondary block rounded-lg p-8 transition-all transform hover:scale-105">
      <h2 className="text-2xl font-bold">MI COLECCIÓN</h2>
      <p className="text-muted-foreground">Ver tu álbum de cartas</p>
    </Link>
    <button onClick={() => setView('formation')} className="bg-secondary/80 hover:bg-secondary rounded-lg p-8 transition-all transform hover:scale-105">
      <h2 className="text-2xl font-bold">MI EQUIPO</h2>
      <p className="text-muted-foreground">Arma tu alineación</p>
    </button>
    <button onClick={() => setView('vs_match')} className="bg-accent/80 hover:bg-accent col-span-1 md:col-span-2 lg:col-span-1 rounded-lg p-8 transition-all transform hover:scale-105">
      <h2 className="text-2xl font-bold">PARTIDO VS</h2>
      <p className="text-muted-foreground">Juega contra la IA</p>
    </button>
    <button className="bg-muted/50 rounded-lg p-8 cursor-not-allowed col-span-1 md:col-span-2 lg:col-span-2">
      <h2 className="text-2xl font-bold">INTERCAMBIOS</h2>
      <p className="text-muted-foreground">(Próximamente)</p>
    </button>
  </div>
);

const PackOpeningView = ({ cards, setView }: { cards: CardType[], setView: (v: View) => void }) => {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCardIndex, setRevealedCardIndex] = useState<number>(-1);

  const handleOpenPackAnimation = () => {
    setIsOpening(true);
    setTimeout(() => {
      setRevealedCardIndex(0); // Reveal the first card
    }, 1000);
  };

  const handleNextCard = () => {
    if (revealedCardIndex < cards.length - 1) {
      setRevealedCardIndex(prev => prev + 1);
    } else {
      // Last card clicked, go to collection
      router.push('/collectibles/collection');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence>
        {revealedCardIndex === -1 && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ scale: 0, opacity: 0, rotate: 720 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <CardPack onOpen={handleOpenPackAnimation} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {revealedCardIndex > -1 && revealedCardIndex < cards.length && (
          <motion.div
            key={revealedCardIndex}
            initial={{ opacity: 0, y: 100, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={handleNextCard}
            className="cursor-pointer"
          >
            <CollectibleCard card={cards[revealedCardIndex]} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {revealedCardIndex > -1 && (
        <p className="mt-4 text-muted-foreground">Haz clic en la carta para revelar la siguiente</p>
      )}

      <div className="mt-8 flex gap-4">
        <Button onClick={() => setView('menu')}>Volver al Menú</Button>
      </div>
    </div>
  );
};


const TeamFormationView = ({ userCollection, team, setTeam, setView }: { userCollection: CardType[], team: typeof initialTeam, setTeam: (t: typeof initialTeam) => void, setView: (v: View) => void }) => {

    const handleSaveTeam = () => {
        setTeam(team);
        alert('Equipo guardado!');
    }

    const availableCards = userCollection.filter(
        (card) => ![...team.formation.starters, ...team.formation.subs].some((teamCard) => teamCard?.id === card.id)
    );

  return (
    <div className="flex flex-col gap-4">
        <Button onClick={() => setView('menu')} className="self-start"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Droppable droppableId="collectionDroppable">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="lg:col-span-1 bg-card/50 p-4 rounded-lg h-[600px] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Mis Cartas Disponibles</h2>
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
                        </div>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <div className="lg:col-span-2 bg-green-800/20 p-4 rounded-lg border-2 border-dashed border-gray-400">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{team.name}</h2>
                    <Button onClick={handleSaveTeam} size="sm">Guardar Equipo</Button>
                </div>
                
                <h3 className="font-semibold mb-2 text-center">TITULARES</h3>
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {team.formation.starters.map((card, index) => (
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
                                            <CollectibleCard card={card} small/>
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
                    {team.formation.subs.map((card, index) => (
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
                                            <CollectibleCard card={card} small/>
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
  );
};


type Strategy = 'defensiva' | 'normal' | 'ofensiva';
type MatchEvent = { minute: number; text: string; team: 'user' | 'bot'; };

const VsMatchSimulation = ({ userTeam, botTeam, setView }: { userTeam: typeof initialTeam, botTeam: typeof initialTeam, setView: (v: View) => void }) => {
    const [time, setTime] = useState(0);
    const [score, setScore] = useState({ user: 0, bot: 0 });
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [strategy, setStrategy] = useState<Strategy>('normal');
    const [isFinished, setIsFinished] = useState(false);
    
    const [userStamina, setUserStamina] = useState(userTeam.formation.starters.map(() => 100));
    const [botStamina, setBotStamina] = useState(botTeam.formation.starters.map(() => 100));

    const calculateTeamRating = (teamLineup: (CardType | null)[], stamina: number[]) => {
        const activePlayers = teamLineup.filter(p => p !== null) as CardType[];
        if (activePlayers.length === 0) return 0;
        const totalRating = activePlayers.reduce((acc, player, index) => {
             const staminaFactor = Math.max(0.5, stamina[index] / 100);
             return acc + player.rating * staminaFactor;
        }, 0);
        return totalRating / activePlayers.length;
    };

    const userAvgRating = calculateTeamRating(userTeam.formation.starters, userStamina);
    const botAvgRating = calculateTeamRating(botTeam.formation.starters, botStamina);

    const runSimulation = useCallback(() => {
        if(time >= 90) {
            setIsFinished(true);
            return;
        }

        // Reduce stamina
        setUserStamina(stamina => stamina.map(s => Math.max(0, s - 0.5)));
        setBotStamina(stamina => stamina.map(s => Math.max(0, s - 0.5)));

        // User team goal chance
        let userGoalProb = userAvgRating / 1000;
        if(strategy === 'ofensiva') userGoalProb *= 1.5;
        if(strategy === 'defensiva') userGoalProb *= 0.5;

        if (Math.random() < userGoalProb) {
            const scorer = userTeam.formation.starters.filter(p => p)[Math.floor(Math.random() * userTeam.formation.starters.filter(p => p).length)]!;
            setScore(s => ({ ...s, user: s.user + 1 }));
            setEvents(e => [...e, { minute: time, text: `¡GOL de ${scorer.name}!`, team: 'user' }]);
        }

        // Bot team goal chance
        let botGoalProb = botAvgRating / 1000;
        if(strategy === 'ofensiva') botGoalProb *= 1.2; // Higher risk
        
        if (Math.random() < botGoalProb) {
            const scorer = botTeam.formation.starters.filter(p => p)[Math.floor(Math.random() * botTeam.formation.starters.filter(p => p).length)]!;
            setScore(s => ({ ...s, bot: s.bot + 1 }));
            setEvents(e => [...e, { minute: time, text: `Gol de ${scorer.name}`, team: 'bot' }]);
        }
        
        // Card event
        if(Math.random() < 0.02) {
             const teamToCard = Math.random() > 0.5 ? 'user' : 'bot';
             const lineup = teamToCard === 'user' ? userTeam.formation.starters : botTeam.formation.starters;
             const playerToCard = lineup.filter(p => p)[Math.floor(Math.random() * lineup.filter(p => p).length)]!;
             const cardType = Math.random() > (playerToCard.stats.def / 120) ? 'Roja' : 'Amarilla';
             setEvents(e => [...e, { minute: time, text: `Tarjeta ${cardType} para ${playerToCard.name}`, team: teamToCard }]);
        }


        setTime(t => t + 1);
    }, [time, userAvgRating, botAvgRating, strategy, userTeam, botTeam]);
    
    useEffect(() => {
        const gameInterval = setInterval(runSimulation, 500);
        return () => clearInterval(gameInterval);
    }, [runSimulation]);

    const finalResult = isFinished ? (score.user > score.bot ? 'Victoria' : score.user < score.bot ? 'Derrota' : 'Empate') : null;
    
    return (
        <div className="bg-card/50 p-6 rounded-lg">
             <Button onClick={() => setView('menu')} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Salir del Partido</Button>
            <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold">{userTeam.name}</h2>
                    <p className="text-lg">Rating: {userAvgRating.toFixed(2)}</p>
                </div>
                <div className="text-4xl font-bold tracking-widest">{score.user} - {score.bot}</div>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{botTeam.name}</h2>
                    <p className="text-lg">Rating: {botAvgRating.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
                <Progress value={(time/90) * 100} className="bg-primary" />
                <span className="absolute w-full text-center top-0 text-xs font-bold text-white">{time}'</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h3 className="font-bold text-center mb-2">Mi Equipo</h3>
                    {userTeam.formation.starters.map((player, i) => player && (
                        <div key={i} className="text-sm flex justify-between items-center">
                            <span>{player.name} ({player.rating})</span>
                            <Progress value={userStamina[i]} className="w-1/2 h-2" />
                        </div>
                    ))}
                </div>
                 <div className="md:col-span-1 h-64 overflow-y-auto bg-black/20 p-2 rounded">
                    <h3 className="font-bold text-center mb-2">Eventos</h3>
                    {events.slice().reverse().map((event, i) => (
                        <p key={i} className={cn("text-sm", event.team === 'user' ? 'text-green-400' : 'text-red-400')}>
                            {event.minute}': {event.text}
                        </p>
                    ))}
                </div>
                <div className="md:col-span-1">
                    <h3 className="font-bold text-center mb-2">Estrategia</h3>
                    <div className="flex justify-center gap-2">
                        <Button size="sm" variant={strategy === 'defensiva' ? 'default' : 'outline'} onClick={() => setStrategy('defensiva')}><Shield className="mr-2 h-4 w-4"/>Defensiva</Button>
                        <Button size="sm" variant={strategy === 'normal' ? 'default' : 'outline'} onClick={() => setStrategy('normal')}><Dices className="mr-2 h-4 w-4"/>Normal</Button>
                        <Button size="sm" variant={strategy === 'ofensiva' ? 'default' : 'outline'} onClick={() => setStrategy('ofensiva')}><Swords className="mr-2 h-4 w-4"/>Ofensiva</Button>
                    </div>
                </div>
            </div>
            <AlertDialog open={isFinished}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-center">¡Partido Terminado!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        El resultado final es {score.user} - {score.bot}.
                        <p className={cn("text-xl font-bold mt-2", 
                            finalResult === 'Victoria' && 'text-green-400',
                            finalResult === 'Derrota' && 'text-red-400',
                            finalResult === 'Empate' && 'text-yellow-400'
                        )}>{finalResult}</p>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogAction onClick={() => { setTime(0); setScore({user: 0, bot: 0}); setEvents([]); setIsFinished(false); }}>Jugar de Nuevo</AlertDialogAction>
                    <Button variant="secondary" onClick={() => setView('menu')}>Volver al Menú</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
