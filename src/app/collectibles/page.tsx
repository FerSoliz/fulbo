'use client';
import { useState, useEffect } from 'react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { CardPack } from '@/components/card-pack';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dices, Shield, Swords, PackageOpen, Layers, Users, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

export default function CollectibleCardsPage() {
  const [view, setView] = useState<View>('menu');
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [userTeam, setUserTeam] = useState(initialTeam);
  const [lastOpenedPack, setLastOpenedPack] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { user, availablePacks, setAvailablePacks, nextPackTimestamp, setNextPackTimestamp, countdown, trackPackOpening } = useUser();

  useEffect(() => {
    setIsClient(true);
    const fetchUserData = async () => {
        if (user && user.id !== 'visitor') {
            const collectionRef = doc(db, 'users', user.id, 'data', 'collectibles');
            const collectionSnap = await getDoc(collectionRef);
            if (collectionSnap.exists()) {
                const collectionIds = collectionSnap.data().cardIds as number[];
                setUserCollection(allCards.filter(c => collectionIds.includes(c.id)));
            }

            const teamRef = doc(db, 'users', user.id, 'data', 'team');
            const teamSnap = await getDoc(teamRef);
            if (teamSnap.exists()) {
                setUserTeam(teamSnap.data() as typeof initialTeam);
            }
        } else {
            setUserCollection([]);
            setUserTeam(initialTeam);
        }
    };
    fetchUserData();
  }, [user]);

  const saveCollection = async (collection: CardType[]) => {
    if (!user || user.id === 'visitor') return;
    setUserCollection(collection);
    const collectionRef = doc(db, 'users', user.id, 'data', 'collectibles');
    const cardIds = collection.map(c => c.id);
    await setDoc(collectionRef, { cardIds }, { merge: true });
  };

  const saveTeam = async (team: typeof initialTeam) => {
    if (!user || user.id === 'visitor') return;
    setUserTeam(team);
    const teamRef = doc(db, 'users', user.id, 'data', 'team');
    await setDoc(teamRef, team, { merge: true });
  }
  
  const getCardByProbability = (): CardType => {
    const rand = Math.random() * 100;
    if (rand < 70) { 
        const commonCards = allCards.filter(c => c.id >= 1 && c.id <= 11);
        return commonCards[Math.floor(Math.random() * commonCards.length)];
    } 
    else if (rand < 94) {
        const rareCards = allCards.filter(c => c.id >= 12 && c.id <= 16);
        return rareCards[Math.floor(Math.random() * rareCards.length)];
    } 
    else if (rand < 99) { 
        const epicCards = allCards.filter(c => c.id === 17 || c.id === 18 || c.id === 19);
        return epicCards[Math.floor(Math.random() * epicCards.length)];
    } 
    else { 
        return allCards.find(c => c.id === 20)!;
    }
  }

  const handleOpenPack = async () => {
    if (user?.id === 'visitor' || availablePacks <= 0) return;
    
    const newCards: CardType[] = [];
    for (let i = 0; i < 3; i++) {
        newCards.push(getCardByProbability());
    }
    
    setLastOpenedPack(newCards);
    
    const updatedCollection = [...userCollection];
    newCards.forEach(newCard => {
      if (!updatedCollection.some(card => card.id === newCard.id)) {
        updatedCollection.push(newCard);
      }
    });
    
    await saveCollection(updatedCollection);
    trackPackOpening();

    const newPackCount = availablePacks - 1;
    setAvailablePacks(newPackCount);
    
    if (nextPackTimestamp === null && newPackCount < 2) {
      setNextPackTimestamp(Date.now() + SIX_HOURS_IN_MS);
    }
    
    setView('pack');
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;
    
    let newUserTeam = { ...userTeam };
    let newCollection = [...userCollection];

    if (sourceListId === 'collectionDroppable') {
      const draggedCard = newCollection[source.index];
      
      if (destListId.startsWith('starter-')) {
        const starterIndex = parseInt(destListId.split('-')[1]);
        if(newUserTeam.formation.starters[starterIndex]) { 
            newCollection.push(newUserTeam.formation.starters[starterIndex]!);
        }
        newUserTeam.formation.starters[starterIndex] = draggedCard;
        newCollection.splice(source.index, 1);
      } else if (destListId.startsWith('sub-')) {
        const subIndex = parseInt(destListId.split('-')[1]);
         if(newUserTeam.formation.subs[subIndex]) { 
            newCollection.push(newUserTeam.formation.subs[subIndex]!);
        }
        newUserTeam.formation.subs[subIndex] = draggedCard;
        newCollection.splice(source.index, 1);
      }
    } 
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
    
    setUserTeam(newUserTeam);
    setUserCollection(newCollection);
  };
  
  if (!isClient) {
    return <div className="p-4 text-center">Cargando juego de cartas...</div>;
  }

  const renderView = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onOpenPack={handleOpenPack} setView={setView} user={user} availablePacks={availablePacks} countdown={countdown}/>;
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
    <div className="p-4 sm:p-6 lg:p-8 text-white min-h-screen flex items-center justify-center">
      <div className="w-full">
        <div className="flex justify-center">
            {renderView()}
        </div>
      </div>
    </div>
  );
}

const MainMenu = ({ onOpenPack, setView, user, availablePacks, countdown }: { onOpenPack: () => void, setView: (v: View) => void, user: any, availablePacks: number, countdown: string }) => {
    const isVisitor = user?.id === 'visitor';
    const hasFreePack = availablePacks > 0;

    return (
    <Card className="w-full max-w-lg bg-card/70">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="relative md:col-span-1 h-64 md:h-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-r-none">
          <Image
               src="https://i.postimg.cc/QMqLDWsL/BANNER-GAME.png"
               alt="Banner del juego de cartas coleccionables"
               fill
               className="object-cover"
           />
        </div>
        <div className="md:col-span-2 p-4 flex flex-col justify-center">
          <CardHeader className="p-2">
            <CardTitle className="text-2xl font-bold uppercase">MENU</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-4">
              <div>
                <Button
                     className={cn("w-full h-auto p-3 justify-between text-base font-semibold border-b-4 border-red-800 bg-gradient-to-b from-destructive to-red-800 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 rounded-full", (isVisitor || !hasFreePack) && "opacity-60 cursor-not-allowed")}
                     onClick={onOpenPack}
                     disabled={isVisitor || !hasFreePack}
                >
                  <div className="relative flex items-center gap-3">
                    {hasFreePack && <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>}
                    <PackageOpen className="w-5 h-5" />
                     {hasFreePack ? <span>ABRIR SOBRE ({availablePacks})</span> : <span>{countdown || '...'}</span>}
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <div>
                <Link href="/collectibles/collection">
                  <Button className="w-full h-auto p-3 justify-between text-base font-semibold border-b-4 border-red-800 bg-gradient-to-b from-destructive to-red-800 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 rounded-full">
                    <div className="flex items-center gap-3"><Layers className="w-5 h-5" /><span>MI COLECCIÓN</span></div>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div>
                <Button
                     className="w-full h-auto p-3 justify-between text-base font-semibold border-b-4 border-red-800 bg-gradient-to-b from-destructive to-red-800 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 opacity-60 cursor-not-allowed rounded-full"
                     onClick={() => setView("formation")}
                     disabled
                >
                  <div className="flex items-center gap-3"><Users className="w-5 h-5" /><span>MI EQUIPO</span></div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <div>
                <Button
                     className="w-full h-auto p-3 justify-between text-base font-semibold border-b-4 border-red-800 bg-gradient-to-b from-destructive to-red-800 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 opacity-60 cursor-not-allowed rounded-full"
                     onClick={() => setView("vs_match")}
                     disabled
                >
                  <div className="flex items-center gap-3"><Swords className="w-5 h-5" /><span>PARTIDO VS</span></div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <div>
                <Button
                     className="w-full h-auto p-3 justify-between text-base font-semibold border-b-4 border-red-800 bg-gradient-to-b from-destructive to-red-800 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 opacity-60 cursor-not-allowed rounded-full"
                     disabled
                >
                  <div className="flex items-center gap-3"><ArrowLeftRight className="w-5 h-5" /><span>INTERCAMBIOS</span></div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
 )
};

const PackOpeningView = ({ cards, setView }: { cards: CardType[], setView: (v: View) => void }) => {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [packVisible, setPackVisible] = useState(true);
  const [revealedCardIndex, setRevealedCardIndex] = useState<number>(-1);

  const handleOpenPackAnimation = () => {
    if (cards.length > 0 && !isOpening) {
      setIsOpening(true);
      setTimeout(() => {
        setPackVisible(false);
        setRevealedCardIndex(0); 
      }, 800); 
    }
  };

  const handleNextCard = () => {
    if (revealedCardIndex < cards.length - 1) {
      setRevealedCardIndex(prev => prev + 1);
    } else {
      router.push('/collectibles/collection');
    }
  };
  
  useEffect(() => {
    if (cards.length === 0) {
        setView('menu');
        return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, setView]);


  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <AnimatePresence>
        {packVisible && (
          <motion.div
            key="pack"
            initial={{ opacity: 1, scale: 1 }}
            animate={isOpening ? { scale: 1.1, transition: { duration: 0.3, ease: 'easeOut' } } : {}}
            exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
            className="flex flex-col items-center"
          >
            <CardPack />
             <Button onClick={handleOpenPackAnimation} className="mt-8">
              ABRIR SOBRE
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!packVisible && revealedCardIndex > -1 && revealedCardIndex < cards.length && (
          <motion.div
            key={revealedCardIndex}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={handleNextCard}
            className="cursor-pointer w-72 flex flex-col items-center"
          >
            <CollectibleCard card={cards[revealedCardIndex]} />
            <p className="mt-4 text-muted-foreground">Haz clic en la carta para revelar la siguiente</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {revealedCardIndex > -1 && (
        <div className="mt-8">
          <Button onClick={() => setView('menu')} variant="secondary">Volver al Menú</Button>
        </div>
      )}
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

    useEffect(() => {
        const runSimulation = () => {
            if(time >= 90) {
                setIsFinished(true);
                return;
            }

            setUserStamina(stamina => stamina.map(s => Math.max(0, s - 0.5)));
            setBotStamina(stamina => stamina.map(s => Math.max(0, s - 0.5)));

            let userGoalProb = userAvgRating / 1000;
            if(strategy === 'ofensiva') userGoalProb *= 1.5;
            if(strategy === 'defensiva') userGoalProb *= 0.5;

            if (Math.random() < userGoalProb) {
                const scorer = userTeam.formation.starters.filter(p => p)[Math.floor(Math.random() * userTeam.formation.starters.filter(p => p).length)]!;
                setScore(s => ({ ...s, user: s.user + 1 }));
                setEvents(e => [...e, { minute: time, text: `¡GOL de ${scorer.name}!`, team: 'user' }]);
            }

            let botGoalProb = botAvgRating / 1000;
            if(strategy === 'ofensiva') botGoalProb *= 1.2; 
            
            if (Math.random() < botGoalProb) {
                const scorer = botTeam.formation.starters.filter(p => p)[Math.floor(Math.random() * botTeam.formation.starters.filter(p => p).length)]!;
                setScore(s => ({ ...s, bot: s.bot + 1 }));
                setEvents(e => [...e, { minute: time, text: `Gol de ${scorer.name}`, team: 'bot' }]);
            }
            
            if(Math.random() < 0.02) {
                 const teamToCard = Math.random() > 0.5 ? 'user' : 'bot';
                 const lineup = teamToCard === 'user' ? userTeam.formation.starters : botTeam.formation.starters;
                 const playerToCard = lineup.filter(p => p)[Math.floor(Math.random() * lineup.filter(p => p).length)]!;
                 const cardType = Math.random() > (playerToCard.stats.def / 120) ? 'Roja' : 'Amarilla';
                 setEvents(e => [...e, { minute: time, text: `Tarjeta ${cardType} para ${playerToCard.name}`, team: teamToCard }]);
            }

            setTime(t => t + 1);
        };

        const gameInterval = setInterval(runSimulation, 500);
        return () => clearInterval(gameInterval);
    }, [time, userAvgRating, botAvgRating, strategy, userTeam, botTeam]);

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
