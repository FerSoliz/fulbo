'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bug, Send, SquarePen } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Conversation } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from './ui/scroll-area';

export function FloatingActionButtons() {
  const { user: currentUser, allUsers } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = ref(db, 'conversations');
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userConversations: Conversation[] = Object.keys(data)
        .map((id) => ({ id, ...data[id] }))
        .filter((convo: Conversation) => convo.participants?.includes(currentUser.id));

      setConversations(userConversations);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser || currentUser.name === 'VISITANTE') {
    return null; // Don't show for visitors
  }
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if(isToday(date)) return format(date, 'p', { locale: es });
    if(isYesterday(date)) return 'Ayer';
    return format(date, 'P', { locale: es });
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-4">
        <TooltipProvider>
            {/* Botón de Mensajes */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                             <Button 
                                className="rounded-full h-11 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                            >
                                <img src="https://i.postimg.cc/JhYwF0RF/icono-mensajes.png" alt="Mensajes" className="h-5 w-5 mr-2" />
                                <span className="font-bold text-base">MENSAJES</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>Abrir Mensajes</p>
                    </TooltipContent>
                </Tooltip>

                <DropdownMenuContent side="top" align="end" className="w-80 mb-2">
                    <div className="flex items-center justify-between p-2">
                        <DropdownMenuLabel className="p-0">Mensajes</DropdownMenuLabel>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <SquarePen className="h-5 w-5" />
                        </Button>
                    </div>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-80">
                         {conversations.length > 0 ? conversations
                            .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))
                            .map(convo => {
                            const otherUserId = convo.participants.find(p => p !== currentUser?.id);
                            const otherUser = allUsers.find(u => u.id === otherUserId);
                            if (!otherUser) return null;
                            
                            return (
                                <DropdownMenuItem key={convo.id} className="p-2" onClick={() => router.push(`/messages?recipient=${otherUser.id}`)}>
                                    <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src={otherUser.avatar} />
                                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold truncate text-sm">{otherUser.name}</h3>
                                            {convo.lastMessage && <p className="text-xs text-muted-foreground">{formatTimestamp(convo.lastMessage.timestamp)}</p>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage?.text || 'Inicia la conversación'}</p>
                                    </div>
                                </DropdownMenuItem>
                            )
                         }) : (
                            <p className="text-center text-sm text-muted-foreground p-4">No tienes conversaciones.</p>
                         )}
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>

        </TooltipProvider>
      </div>
    </>
  );
}
