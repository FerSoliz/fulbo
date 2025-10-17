
'use client';

import {
  Bell,
  MessageSquare,
  Cog,
  Home,
  LogOut,
  ShieldCheck,
  Store,
  Swords,
  Ticket,
  Trophy,
  User as UserIcon,
  BarChart2,
  Youtube,
  Instagram,
  Footprints,
  KeyRound,
  Loader2,
  Download,
  Landmark, // 1. Importar el icono
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from "react";
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';


const menuItems = [
    { href: '/', icon: Home, label: 'INICIO' },
    { href: '/tournaments', icon: Trophy, label: 'LIGAS EN CURSO' },
    { href: '/tournament', icon: Ticket, label: 'INSCRIBIRME' },
    { href: '/store', icon: Store, label: 'TIENDA' },
    { href: '/collectibles', icon: Swords, label: 'TGC SUDONE' },
    { href: '/ranking', icon: BarChart2, label: 'RANKING' },
    { href: '/messages', icon: MessageSquare, label: 'MENSAJES' },
    // 2. Agrupar los enlaces de admin
    { href: '/admin', icon: ShieldCheck, label: 'PANEL DE ADMIN' },
];

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M16.6 14c-.2-.1-1.5-0.7-1.7-0.8-.2-.1-.4-.1-.6 0.1s-.6 0.8-.8 1c-.1 0.2-.3 0.2-.5 0.1-1-0.3-1.9-0.9-2.7-1.7-0.6-0.6-1.1-1.4-1.2-1.6-.1-.2 0-.4 0.1-.5 0.1-.1 0.2-.3 0.4-.4 0.1-.1 0.2-.2 0.2-.3 0.1-.1 0.1-.3 0-0.4C9.5 8.8 9.1 7.8 8.9 7.4c-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5 0.1-.7 0.3-0.2 0.2-.8 0.8-.8 1.9s0.8 2.2 1 2.4c0.1 0.2 1.5 2.3 3.7 3.2 0.5 0.2 0.9 0.4 1.2 0.5 0.7 0.2 1.3 0.2 1.8 0.1 0.5-.1 1.5-0.6 1.7-1.2 0.2-.5 0.2-1 0.1-1.1s-.2-.2-.4-.3z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
  </svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      fill="currentColor"
      {...props}
    >
        <path d="M20.8,3.2c-1.7-0.6-3.5-1-5.3-1.2C15.3,2,15.2,2,15,2.1c-0.2,0-0.3-0.1-0.5-0.1c-1.8,0.2-3.6,0.6-5.3,1.2	C4.9,4.7,3.5,8.2,3,11.8c-0.1,0.5-0.1,1,0,1.5c0.5,4.7,2.2,8.4,5.4,11.2c1.4,1.2,3.1,2.2,4.9,2.8c0.2,0.1,0.4,0.1,0.6,0.1c0.2,0,0.4,0,0.6-0.1c1.8-0.6,3.5-1.5,4.9-2.8c3.2-2.8,4.9-6.5,5.4-11.2c0.1-0.5,0.1-1,0-1.5C24.5,8.2,23.1,4.7,20.8,3.2z M12.2,19.2c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6S13.6,19.2,12.2,19.2z M18.4,19.2c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6S19.8,19.2,18.4,19.2z"/>
    </svg>
);

const socialItems = [
    { href: 'https://www.youtube.com/@ORGANIZACIONSUDONE', icon: Youtube, label: 'YOUTUBE' },
    { href: 'https://www.instagram.com/liga.sudone/', icon: Instagram, label: 'INSTAGRAM' },
    { href: 'https://wa.me/5491139027578', icon: WhatsAppIcon, label: 'WHATSAPP' },
    { href: 'https://discord.gg/H8tuKK5c', icon: DiscordIcon, label: 'DISCORD' }
];

const footerMenuItems = [
    { href: '/settings', icon: Cog, label: 'CONFIGURACIÓN' },
    { href: '/profile', icon: UserIcon, label: 'MI PERFIL' },
];

const AdminAuthDialog = ({ isOpen, onOpenChange, onAuthorized }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onAuthorized: () => void }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const correctPassword = "basilala12e";

    const handleVerify = () => {
        setIsLoading(true);
        setTimeout(() => { // Simulating network delay
            if (password === correctPassword) {
                onAuthorized();
                toast({ title: "Acceso concedido", description: "¡Bienvenido, Editor! Tu rol ha sido actualizado." });
                onOpenChange(false);
            } else {
                toast({ title: "Acceso Denegado", description: "La contraseña es incorrecta.", variant: "destructive" });
            }
            setIsLoading(false);
            setPassword('');
        }, 500);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Acceso al Panel de Administrador</DialogTitle>
                    <DialogDescription>
                        Ingresa la contraseña para obtener permisos de editor y acceder a las herramientas de administración.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="admin-password">Contraseña de Editor</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            className="pl-9"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
                    <Button onClick={handleVerify} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verificar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

interface MainSidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function MainSidebar({ isMobile = false, onLinkClick }: MainSidebarProps) {
  const pathname = usePathname();
  const { user, loading, logout, setUser, setAllUsers, allUsers, trackInteraction } = useUser();
  const router = useRouter();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
}, []);

  const handleInstallClick = () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      if (onLinkClick) onLinkClick();
  };

  const handleAdminPanelClick = (e: React.MouseEvent) => {
      if (user?.role !== 'admin' && user?.role !== 'editor') {
          e.preventDefault();
          setIsAuthDialogOpen(true);
      } else {
        trackInteraction();
      }
      if (onLinkClick) onLinkClick();
  }
  
  const handleMenuClick = () => {
    if (user?.id !== 'visitor') {
      trackInteraction();
    }
    if (onLinkClick) onLinkClick();
  }

  const handleAuthorization = () => {
      if (!user) return;
      const updatedUser = { ...user, role: 'editor' as const };
      
      const newAllUsers = allUsers.map((u) => (u.id === user.id ? updatedUser : u));
      setAllUsers(newAllUsers);
       if (user?.id === updatedUser.id) {
          setUser(updatedUser);
        }

      router.push('/admin');
  }

  const handleLogout = async () => {
    if (onLinkClick) onLinkClick();
    if (user?.id === 'visitor') {
        router.push('/login');
    }
    else {
        await logout();
    }
  }

  const renderMenuItems = (items: (typeof menuItems | typeof footerMenuItems)[]) => {
    return items.map((item) => {

      const isAdminLink = item.href?.startsWith('/admin');
      
      // 3. Modificar la lógica de visualización de los enlaces de admin
      // Si no es admin/editor Y el link es de admin, NO lo mostramos.
      if (isAdminLink && user?.role !== 'admin' && user?.role !== 'editor') {
        return null;
      }

      let finalHref = item.href;
      if(item.label === 'MI PERFIL' && user && user.id !== 'visitor') {
          finalHref = `/profile/${user.id}`;
      } else if (item.label === 'MI PERFIL' && (!user || user.id === 'visitor')) {
          finalHref = '/login'; // Redirect visitor to login
      }
      
      const isActive = finalHref === '/' 
        ? pathname === '/'
        : (pathname === finalHref || pathname.startsWith(`${finalHref}/`));

      const isCollectibles = item.label === 'TGC SUDONE';

      return (
          <li key={item.href} className={cn(isCollectibles && '')}>
              <Link
                  href={finalHref}
                  onClick={isAdminLink ? handleAdminPanelClick : handleMenuClick}
                  >
                <Button
                  variant='ghost'
                  className={cn(
                    'main-sidebar-button w-full justify-start gap-2 text-foreground'
                  )}
                  data-active={isActive}
                  disabled={loading}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="lg:text-base">{item.label}</span>
                </Button>
              </Link>
          </li>
      );
    });
  };

  const sidebarClasses = cn(
    "flex flex-col bg-card/80 backdrop-blur-sm h-full",
    { "fixed left-0 hidden h-screen w-64 flex-col border-r md:flex": !isMobile },
  );

  return (
      <>
          <aside className={cn(sidebarClasses, "rounded-r-xl")}>
              <div className="flex h-16 items-center justify-center border-b p-2">
                 <Link href="/" onClick={onLinkClick}>
                  <div className="relative" style={{ width: '140px', height: '40px' }}>
                    <Image
                      src="/sudone-titulo.png"
                      alt="SUDONE Logo"
                      fill
                      style={{ objectFit: 'contain' }}
                      priority
                      sizes="140px"
                    />
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-2 p-2">
                  {loading ? (
                       <>
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                              <Skeleton className="h-4 w-[100px]" />
                              <Skeleton className="h-4 w-[80px]" />
                          </div>
                      </>
                  ) : user ? (
                      <>
                          <Link
                              href={user.id === 'visitor' ? '/login' : `/profile/${user.id}`}
                              onClick={onLinkClick}
                              >
                              <AnimatedAvatar>
                                  <Avatar className="w-12 h-12">
                                      <AvatarImage src={user.avatar} alt="User avatar" />
                                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                              </AnimatedAvatar>
                          </Link>
                          <div className="flex flex-col overflow-hidden">
                              {user.id !== 'visitor' ? (
                                <>
                                  <span className="font-semibold truncate">@{user.username}</span>
                                  <span className="text-sm text-muted-foreground truncate">{user.name}</span>
                                </>
                              ) : (
                                 <span className="font-semibold truncate">{user.name}</span>
                              )}
                          </div>
                      </>
                  ) : null}
              </div>

              <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-col gap-1 p-2">
                      {renderMenuItems(menuItems)}
                  </ul>
                  <ul className="mt-auto flex flex-col gap-1 border-t p-2">
                      <div className="flex justify-start gap-2 py-2">
                          {socialItems.map(item => (
                              <li key={item.href}>
                                   <Link href={item.href} target="_blank" rel="noopener noreferrer">
                                      <Button
                                      variant='destructive'
                                      size="icon"
                                      className='bg-red-600 hover:bg-red-700 text-white'
                                      >
                                      <item.icon className="h-5 w-5" />
                                      </Button>
                                  </Link>
                              </li>
                          ))}
                      </div>
                      {user && user.id !== 'visitor' && renderMenuItems(footerMenuItems)}
                       {installPrompt && (
                          <li>
                              <Button
                                  variant="ghost"
                                  className="main-sidebar-button w-full justify-start gap-2 text-foreground"
                                  onClick={handleInstallClick}
                              >
                                  <Download className="h-5 w-5" />
                                  <span className="lg:text-base">DESCARGAR APP</span>
                              </Button>
                          </li>
                       )}
                       <li>
                          <Button
                              variant="ghost"
                              className="main-sidebar-button w-full justify-start gap-2 text-foreground"
                              onClick={handleLogout}
                              disabled={loading}
                          >
                              <LogOut className="h-5 w-5" />
                              <span className="lg:text-base">{user?.id === 'visitor' ? 'INICIAR SESIÓN' : 'CERRAR SESIÓN'}</span>
                          </Button>
                      </li>
                  </ul>
              </nav>
          </aside>
          <AdminAuthDialog isOpen={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} onAuthorized={handleAuthorization} />
      </>
  );
}
