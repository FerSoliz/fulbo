'use client';

import { useState, useEffect, useCallback } from 'react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Layers,
  Users,
  ArrowLeftRight,
  Plus,
  Gift,
  MoreVertical,
  PackageOpen,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { sudonepassConfig } from '@/lib/sudonepass-config';
import {
  getUserCollectibles,
  saveUserCardCollection,
  saveUserTeamFormation,
  UserCollectiblesData
} from '@/lib/firebase/db/collectibles';
import { MainMenu } from '@/components/collectibles/MainMenu';
import { PackOpeningView } from '@/components/collectibles/PackOpeningView';
import { TeamFormationView } from '@/components/collectibles/TeamFormationView';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CollectibleCard } from '@/components/collectible-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type View = 'menu' | 'pack' | 'formation';

const getDivisionFromSudpoints = (sp: number): string => {
  if (sp < 100) return 'Bronce IV';
  if (sp < 200) return 'Bronce III';
  if (sp < 300) return 'Bronce II';
  if (sp < 400) return 'Bronce I';
  if (sp < 500) return 'Plata';
  if (sp < 600) return 'Oro';
  if (sp < 700) return 'Crack';
  return 'Leyenda Mundial';
};

export default function CollectibleCardsPage() {
  const [view, setView] = useState<View>('menu');
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [userTeam, setUserTeam] = useState<UserCollectiblesData['team'] | null>(null);
  const [lastOpenedPack, setLastOpenedPack] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const {
    user,
    availablePacks,
    countdown,
    trackPackOpening
  } = useUser();

  const level = user?.sudonepassLevel || 1;
  const currentExp = user?.sudonepassExp || 0;
  const expToNextLevel = sudonepassConfig.expPerLevel(level);
  const passProgress = (currentExp / expToNextLevel) * 100;
  const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);
  
  const userDivision = user ? getDivisionFromSudpoints(user.sudpoints || 0) : 'Bronce IV';

  useEffect(() => {
    setIsClient(true);
    if (user && user.id !== 'visitor') {
      const fetchUserData = async () => {
        const collectiblesData = await getUserCollectibles(user.id);
        const fullCardCollection = allCards.filter(c => collectiblesData.cardIds.includes(c.id));
        setUserCollection(fullCardCollection);
        setUserTeam(collectiblesData.team);
      };
      fetchUserData();
    }
  }, [user]);

  const saveCollection = useCallback(async (collection: CardType[]) => {
    if (!user || user.id === 'visitor') return;
    const cardIds = collection.map(c => c.id);
    await saveUserCardCollection(user.id, cardIds);
    setUserCollection(collection);
  }, [user]);

  const saveTeam = useCallback(async (team: UserCollectiblesData['team']) => {
    if (!user || user.id === 'visitor' || !team) return;
    await saveUserTeamFormation(user.id, team);
    setUserTeam(team);
    toast({ title: 'Equipo guardado', description: 'Tu formación ha sido actualizada.' });
  }, [user, toast]);

  const getCardByProbability = (): CardType => {
    const rand = Math.random() * 100;
    if (rand < 70) {
        const commonCards = allCards.filter(c => c.id >= 1 && c.id <= 11);
        return commonCards[Math.floor(Math.random() * commonCards.length)];
    } else if (rand < 94) {
        const rareCards = allCards.filter(c => c.id >= 12 && c.id <= 16);
        return rareCards[Math.floor(Math.random() * rareCards.length)];
    } else if (rand < 99) {
        const epicCards = allCards.filter(c => c.id === 17 || c.id === 18 || c.id === 19);
        return epicCards[Math.floor(Math.random() * epicCards.length)];
    } else {
        return allCards.find(c => c.id === 20)!;
    }
  };

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
    await trackPackOpening(); 

    setView('pack');
  };
  
  const handleSelectShowcasedCard = (card: CardType | null) => {
      if(userTeam) {
        const updatedTeam = { ...userTeam, showcasedCard: card };
        saveTeam(updatedTeam);
      }
      setIsCardSelectorOpen(false);
  };

  if (!isClient || !user) {
    return <div className="p-4 text-center">Cargando juego de cartas...</div>;
  }

  const menuItems = [
    { id: 'collection', label: 'MI COLECCIÓN', icon: Layers, href: '/collectibles/collection' },
    { id: 'team', label: 'MI EQUIPO', icon: Users, action: () => setView('formation'), disabled: true },
    { id: 'trade', label: 'INTERCAMBIOS', icon: ArrowLeftRight, disabled: true },
  ];

  const renderCentralContent = () => {
    switch (view) {
      case 'menu':
        return <MainMenu onOpenPack={handleOpenPack} availablePacks={availablePacks} countdown={countdown} user={user} />;
      case 'pack':
        return <PackOpeningView cards={lastOpenedPack} onViewChange={setView} />;
      case 'formation':
        if (!userTeam) return <div>Cargando equipo...</div>
        return (
          <TeamFormationView
            userCollection={userCollection}
            team={userTeam}
            onTeamChange={setUserTeam} 
            onViewChange={setView}
            onSave={() => userTeam && saveTeam(userTeam)}
          />
        );
      default:
        return <MainMenu onOpenPack={handleOpenPack} availablePacks={availablePacks} countdown={countdown} user={user} />;
    }
  };

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const content = (
         <div
            className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200 w-32 h-20 rounded-md",
                item.disabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
            )}
        >
            <div className="relative">
              <item.icon className="w-7 h-7 mb-1"/>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
        </div>
    );

    if (item.disabled) {
        return (
            <div className="relative cursor-not-allowed">
                {content}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                    PRÓXIMAMENTE
                </div>
            </div>
        );
    }
    if (item.href) {
        return <Link href={item.href}>{content}</Link>;
    }
    return <button onClick={item.action}>{content}</button>;
  }

  return (
    <div className="collectible-page-background text-white min-h-screen">
      <div id="stars-container" />
      <div className="w-full h-screen flex flex-col items-center justify-between relative">
        <motion.div
          className="fixed top-0 left-0 right-0 z-10 w-full"
          initial={{ y: "-100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="w-full max-w-lg mx-auto bg-card/80 backdrop-blur-sm border-b border-x border-border rounded-b-lg">
            <div className="flex justify-between items-center h-20 px-4 relative">
              <div className="w-1/3">
                <Dialog open={isCardSelectorOpen} onOpenChange={setIsCardSelectorOpen}>
                  <DialogTrigger asChild>
                    <div className="w-12 h-20 bg-muted/50 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors">
                      {userTeam?.showcasedCard ? (
                        <div className="w-full h-full scale-[.4] -translate-x-6 -translate-y-6">
                          <CollectibleCard card={userTeam.showcasedCard as any} small />
                        </div>
                      ) : (
                        <Plus className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Elige tu carta para mostrar</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto p-4">
                      <div 
                        onClick={() => handleSelectShowcasedCard(null)} 
                        className="cursor-pointer bg-destructive/80 text-destructive-foreground hover:bg-destructive rounded-md flex flex-col items-center justify-center text-center p-2 aspect-w-3 aspect-h-4"
                      >
                        <XCircle className="w-8 h-8 mb-2" />
                        <span className="text-xs font-semibold">Quitar Carta</span>
                      </div>
                      {userCollection.map(card => (
                        <div key={card.id} onClick={() => handleSelectShowcasedCard(card)} className="cursor-pointer">
                          <CollectibleCard card={card} small />
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="w-1/3 flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted/20"
                      stroke="currentColor"
                      strokeWidth="4"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <motion.circle
                      className="text-accent"
                      stroke="currentColor"
                      strokeWidth="4"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - passProgress / 100)}
                      transform="rotate(-90 50 50)"
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - passProgress / 100) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="font-bold text-xs -mt-2 bg-card px-2 rounded-full uppercase">{userDivision}</span>
              </div>
              <div className="w-1/3 flex justify-end items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Gift className="w-6 h-6" />
                      {availablePacks > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {availablePacks}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Recompensas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleOpenPack} disabled={availablePacks <= 0}>
                      <PackageOpen className="mr-2 h-4 w-4" />
                      {availablePacks > 0 ? `Abrir Sobre (${availablePacks})` : "No hay sobres"}
                    </DropdownMenuItem>
                    {countdown && <DropdownMenuItem disabled>Próximo sobre en: {countdown}</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-6 h-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />Salir del Juego
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>

        <main className="flex-1 flex items-center justify-center w-full z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full h-full flex items-center justify-center"
            >
              {renderCentralContent()}
            </motion.div>
          </AnimatePresence>

          {/* --- INICIO DE LA CORRECCIÓN: EL BOTÓN FLOTANTE SOLO APARECE EN LA VISTA DE ABRIR SOBRE --- */}
          {view === 'pack' && (
            <motion.div
              className="fixed bottom-24 left-4 z-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full h-12 w-12 shadow-lg"
                onClick={() => setView('menu')}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
          {/* --- FIN DE LA CORRECCIÓN --- */}
        </main>

        <motion.div
          className="fixed bottom-0 left-0 right-0 z-10 w-full bg-card/80 backdrop-blur-sm border-t border-border"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex justify-center items-center gap-4 p-2">
            {menuItems.map((item) => <MenuItem key={item.id} item={item} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
