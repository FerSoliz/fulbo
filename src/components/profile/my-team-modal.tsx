'use client';

import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface MyTeamModalProps {
  profileUser: UserProfile;
  isOwnProfile: boolean;
  onClose: () => void;
}

export function MyTeamModal({ profileUser, isOwnProfile, onClose }: MyTeamModalProps) {
  const { team } = profileUser;

  return (
    <>
      <CardHeader>
        <CardTitle className="text-center">Mi Equipo</CardTitle>
      </CardHeader>
      <CardContent className="text-center p-8">
        {team && team.id ? (
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24 border-2 border-muted">
              {team.crestUrl ? (
                <AvatarImage src={team.crestUrl} alt={`Escudo de ${team.name}`} />
              ) : (
                <ShieldCheck className="w-12 h-12 text-muted-foreground" />
              )}
              <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-bold">{team.name}</h3>
            {isOwnProfile && (
              <Link href="/manage-team" passHref>
                <Button onClick={onClose}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Gestionar Equipo
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ShieldCheck className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {isOwnProfile ? "Aún no perteneces a un equipo." : "Este usuario no tiene un equipo."}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" onClick={onClose} className="w-full">Volver</Button>
      </CardFooter>
    </>
  );
}
