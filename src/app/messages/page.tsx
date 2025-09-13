'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { User, Conversation, Message } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Send, MessageSquareDashed } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

function MessagesPageContent() {
  const { user: currentUser } = useUser();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setAllUsers(storedUsers);

    const savedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(savedConversations);

  }, []);
  
  useEffect(() => {
    if (recipientId && currentUser && allUsers.length > 0) {
      const recipientExists = allUsers.find(u => u.id === recipientId);
      if (!recipientExists) return;

      const conversationId = [currentUser.id, recipientId].sort().join('-');
      const existingConversation = conversations.find(c => c.id === conversationId);

      if (existingConversation) {
        setActiveConversationId(conversationId);
      } else {
        const newConversation: Conversation = {
          id: conversationId,
          participants: [currentUser.id, recipientId],
          messages: [],
        };
        const updatedConversations = [...conversations, newConversation];
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        setActiveConversationId(conversationId);
      }
    } else if (conversations.length > 0 && !activeConversationId) {
       const sortedConversations = [...conversations].sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
       if (sortedConversations.length > 0) {
           setActiveConversationId(sortedConversations[0].id);
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId, currentUser, allUsers]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, conversations]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser || !activeConversationId) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text: newMessage,
      timestamp: Date.now(),
    };

    const updatedConversations = conversations.map(convo => {
      if (convo.id === activeConversationId) {
        return {
          ...convo,
          messages: [...convo.messages, message],
          lastMessage: { text: newMessage, timestamp: message.timestamp },
        };
      }
      return convo;
    });

    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setNewMessage('');
  };
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherParticipantId = activeConversation?.participants.find(p => p !== currentUser?.id);
  const otherParticipant = allUsers.find(u => u.id === otherParticipantId);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if(isToday(date)) return format(date, 'p', { locale: es });
    if(isYesterday(date)) return 'Ayer';
    return format(date, 'P', { locale: es });
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex border rounded-lg m-4 bg-card">
      {/* Sidebar de Conversaciones */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">{currentUser?.name}</h2>
        </div>
        <ScrollArea className="flex-1">
          {conversations
            .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))
            .map(convo => {
            const otherUserId = convo.participants.find(p => p !== currentUser?.id);
            const otherUser = allUsers.find(u => u.id === otherUserId);
            if (!otherUser) return null;
            
            return (
                <div 
                    key={convo.id}
                    className={cn("p-4 flex items-center gap-3 cursor-pointer hover:bg-muted", activeConversationId === convo.id && 'bg-muted/70')}
                    onClick={() => setActiveConversationId(convo.id)}
                >
                    <Avatar>
                        <AvatarImage src={otherUser.avatar} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold truncate">{otherUser.name}</h3>
                            {convo.lastMessage && <p className="text-xs text-muted-foreground">{formatTimestamp(convo.lastMessage.timestamp)}</p>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage?.text || 'Inicia la conversación'}</p>
                    </div>
                </div>
            )
          })}
        </ScrollArea>
      </div>

      {/* Area de Chat Activa */}
      <div className="w-2/3 flex flex-col">
        {activeConversation && otherParticipant ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Link href={`/profile/${otherParticipant.id}`}>
                <Avatar>
                  <AvatarImage src={otherParticipant.avatar} />
                  <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <h2 className="text-lg font-semibold">{otherParticipant.name}</h2>
            </div>
            <ScrollArea className="flex-1 p-4 bg-muted/20">
              <div className="space-y-2">
                {activeConversation.messages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start')}>
                    <div className={cn("max-w-xs md:max-w-md p-3 rounded-lg text-sm", msg.senderId === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  className="rounded-full"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                 <Send className="w-12 h-12 text-foreground"/>
            </div>
            <h2 className="text-2xl font-bold">Tus Mensajes</h2>
            <p className="text-muted-foreground">Envía mensajes privados a un amigo.</p>
            <Button className="mt-4" onClick={() => {
                const firstConvo = conversations.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))[0];
                if (firstConvo) setActiveConversationId(firstConvo.id);
            }}>Empezar a chatear</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando mensajes...</div>}>
            <MessagesPageContent />
        </Suspense>
    )
}
