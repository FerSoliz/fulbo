'use client';

import { Bell, Menu, Layers, LogOut, Search, User as UserIcon, Star, FileText, Heart, Package, Trophy, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MainSidebar } from './main-sidebar';
import { GlobalSearch } from './global-search';
import { getHeaderBannerUrl } from '@/lib/firebase/db';
import { EditBannerButton } from './admin/EditBannerButton';

const notificationIcons: { [key: string]: React.ElementType } = {
  post: FileText,
  sudpoints: Trophy,
  like: Heart,
  pack: Package,
  team: Trophy,
  friend_request: UserCheck,
};

export function PageHeader() {
  const { user, loading, logout, notifications, setNotifications } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [isBannerLoading, setIsBannerLoading] = React.useState(true);

  const isProfilePage = pathname.startsWith('/profile/');

  React.useEffect(() => {
    if (!isProfilePage) {
      const fetchBannerUrl = async () => {
        try {
          const url = await getHeaderBannerUrl();
          setBannerUrl(url);
        } catch (error) {
          console.error("Error al cargar el banner:", error);
        } finally {
          setIsBannerLoading(false);
        }
      };
      fetchBannerUrl();
    }
  }, [isProfilePage]);
  
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  const handleLogout = async () => {
    if (user?.id === 'visitor') {
        router.push('/login');
    } else {
        await logout();
    }
  }
  
  const handleNotificationAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Action clicked:", action);
  }

  const handleOpenNotifications = () => {
    setTimeout(() => {
        setNotifications(prevNotifications => 
            prevNotifications.map(n => ({ ...n, isRead: true }))
        );
    }, 1000);
  }

  return (
      <header className="sticky top-0 z-20 w-full backdrop-blur-md border-b border-white/10">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
              {/* Mobile & Desktop Header Layout */}
              <div className="flex flex-1 items-center gap-2">
                  <div className="md:hidden">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Menu/>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                          <MainSidebar isMobile={true} onLinkClick={() => setIsSheetOpen(false)} />
                        </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex-1">
                      <GlobalSearch />
                  </div>
              </div>

              <div className="flex flex-shrink-0 items-center justify-end">
                  {loading ? (
                     <Skeleton className="h-9 w-9 rounded-full" />
                  ) : user && user.id !== 'visitor' ? (
                      <Link href={`/profile/${user.id}`}>
                          <Avatar className="h-9 w-9 cursor-pointer">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                      </Link>
                  ) : (
                      <Link href="/login">
                          <Button>Iniciar Sesión</Button>
                      </Link>
                  )}
              </div>
          </div>
          
          {/* Banner Section */}
          {!isProfilePage && (
             <div className="px-4 pb-2 relative">
                {isBannerLoading ? (
                   <Skeleton className="w-full h-[150px] rounded-lg" />
                ) : (
                   <>
                     <Link
                         href=" https://www.instagram.com/corre_forest/?hl=es"
                         target="_blank"
                         rel="noopener noreferrer">
                         <Image
                             src={bannerUrl || "/banner-monster.jpg"} // Usa la URL dinámica o el fallback
                             alt="Banner Principal de Sudone"
                             width={1200}
                             height={150}
                             priority
                             className="rounded-lg object-cover"
                         />
                     </Link>
                     <EditBannerButton onUploadComplete={setBannerUrl} />
                   </>
                )}
            </div>
          )}
      </header>
  );
}
