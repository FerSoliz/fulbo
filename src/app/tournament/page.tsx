
"use client"

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    Film,
    Users,
    Award,
    Calendar,
    MapPin,
    Clock,
    Shirt,
    Smartphone,
    Info,
    DollarSign,
    Beer,
    Goal,
    GlassWater,
    PlusCircle,
    Save,
    PenLine,
} from "lucide-react";
import type { User } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useUser } from "@/context/user-context";
import { canAccessAdminPanel } from '@/lib/auth/roles';


type TournamentInfo = {
    id: string;
    title: string;
    subtitle: string;
    details: { iconName: string; text: string; highlight?: string; }[];
    costs: { inscription: string; match: string };
    days?: string;
    timeSlot?: string;
    prizes?: string;
    format: string[];
    contact: { name: string; phone: string; };
    note: string;
};

const initialTournamentData: TournamentInfo[] = [
  {
    id: "sudone-san-cristobal",
    title: "TORNEO SUDONE SAN CRISTOBAL",
    subtitle: "FUTBOL 5 PISO MASCULINO ⚽",
    details: [
      { iconName: "Film", text: "FILMACIÓN DE PARTIDOS, ENTREVISTAS Y CONTENIDO EXCLUSIVO EN YOUTUBE 😎" },
      { iconName: "Beer", text: "PREMIOS EN TORNEO DE PENALES: FERNET, BEBIDAS Y MEDALLAS." },
      { iconName: "Goal", text: "GOLEADOR Y VALLA MENOS VENCIDA:", highlight: "$20.000 PARA CADA UNO" },
      { iconName: "GlassWater", text: "BEBIDA GRATIS PARA EL JUGADOR DEL PARTIDO 🥤👌🏻" },
      { iconName: "Shirt", text: "INCLUYE PECHERAS, GUANTES DE ARQUERO, CINTA DE CAPITÁN Y PELOTAS PROFESIONALES" },
      { iconName: "MapPin", text: "UBICACIÓN: SAN CRISTOBAL, RINCÓN Y COCHABAMBA (CABA)" },
      { iconName: "Users", text: "¡NO TE QUEDES AFUERA, LOS CUPOS SON LIMITADOS!" },
    ],
    costs: {
      inscription: "$30.000",
      match: "$60.000"
    },
    days: "VIERNES",
    timeSlot: "22:00 Y 23:00 HS.",
    prizes: "PREMIO PARA EL CAMPEÓN: TROFEOS, MEDALLAS Y $300.000 EN EFECTIVO. BONUS DE $30.000 POR CLASIFICAR EN PRIMER LUGAR.",
    format: [
      "10 U 8 EQUIPOS, FASE DE LIGA SEGUIDA DE PLAYOFFS.",
      "EL 1° CLASIFICA A LA FINAL, EL 2° A SEMIFINALES Y EL RESTO DISPUTA UN REDUCIDO."
    ],
    contact: {
      name: "Luccio (Organizador)",
      phone: "1141790072"
    },
    note: "¡CUPOS LIMITADOS! 📢"
  }
];

const iconMap: { [key: string]: React.ElementType } = {
    Trophy, Film, Users, Award, Calendar, MapPin, Clock, Shirt, Smartphone, Info, DollarSign, Beer, Goal, GlassWater };

const InfoItem = ({ iconName, text, highlight }: {iconName: string, text: string, highlight?: string}) => {
    const Icon = iconMap[iconName] || Info;
    return (
        <li className="flex items-start gap-4">
            <Icon className="w-6 h-6 text-accent shrink-0 mt-1" />
            <p className="text-muted-foreground uppercase">
                {text} {highlight && <span className="font-bold text-foreground">{highlight}</span>}
            </p>
        </li>
    );
};

export default function TournamentPage() {
    const { user: currentUser } = useUser();
    const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newTournament, setNewTournament] = useState<Partial<TournamentInfo>>({
        title: '',
        subtitle: '',
        costs: { inscription: '', match: '' },
        contact: { name: '', phone: '' },
        note: '',
        days: '',
        timeSlot: '',
        prizes: '',
        format: [],
    });

    useEffect(() => {
        const storedTournaments = JSON.parse(localStorage.getItem("tournament_info_cards") || "[]");
        if (storedTournaments.length > 0) {
            setTournaments([...initialTournamentData, ...storedTournaments]);
        } else {
            setTournaments(initialTournamentData);
        }
    }, []);

    const handleSaveTournament = () => {
        const tournamentToSave: TournamentInfo = {
            id: `tournament-${Date.now()}`,
            title: newTournament.title || "Nuevo Torneo",
            subtitle: newTournament.subtitle || "Descripción del torneo",
            details: [], // Details are now derived from other fields for new tournaments
            costs: { inscription: newTournament.costs?.inscription || '$0', match: newTournament.costs?.match || '$0' },
            days: newTournament.days || 'Día a definir',
            timeSlot: newTournament.timeSlot || 'Horario a definir',
            prizes: newTournament.prizes || 'Premios a definir',
            format: newTournament.format || ["Formato por definir"],
            contact: { name: newTournament.contact?.name || 'Organizador', phone: newTournament.contact?.phone || '' },
            note: newTournament.note || "¡Inscríbete ahora!"
        };

        const updatedTournaments = [...tournaments, tournamentToSave];
        setTournaments(updatedTournaments);

        const customTournaments = updatedTournaments.filter(t => !initialTournamentData.some(it => it.id === t.id));
        localStorage.setItem("tournament_info_cards", JSON.stringify(customTournaments));

        setIsAddDialogOpen(false);
        setNewTournament({ title: '', subtitle: '', costs: { inscription: '', match: '' }, contact: { name: '', phone: '' }, note: '', days: '', timeSlot: '', prizes: '', format: [] });
    };

    const isAdmin = canAccessAdminPanel(currentUser);

   return (
       <div className="p-4 sm:p-6 lg:p-8">
           <div className="max-w-4xl mx-auto space-y-6">
             <CardHeader className="px-0">
                 <CardTitle className="text-3xl">Información de Torneos</CardTitle>
                 <CardDescription>
                   Encuentra todos los detalles sobre nuestros torneos disponibles. ¡Inscríbete y compite!
                 </CardDescription>
             </CardHeader>
                   
                   <div className="grid md:grid-cols-2 gap-6">
              {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="flex flex-col">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-3"><Trophy className="w-8 h-8 text-amber-400"/>{tournament.title}</CardTitle>
                          <CardDescription>{tournament.subtitle}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-muted-foreground text-sm">
                              Haz clic en "MÁS INFO" para ver todos los detalles sobre premios, costos y más.
                          </p>
                      </CardContent>
                      <CardFooter className="grid grid-cols-2 gap-2">
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button className="w-full" variant="outline">
                                      <Info className="mr-2 h-4 w-4"/>
                                      MÁS INFO
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                   <DialogHeader>
                                      <DialogTitle className="text-2xl uppercase">{tournament.title}</DialogTitle>
                                      <DialogDescription>{tournament.subtitle}</DialogDescription>
                                   </DialogHeader>
                                   <div className="max-h-[70vh] overflow-y-auto pr-4 mt-4">
                                      <div className="p-4 bg-muted/20 rounded-lg">
                                          <ul className="space-y-4">
                                          {tournament.prizes && <InfoItem iconName="Award" text={tournament.prizes}/>}
                                          {tournament.details.map((item, index) => (
                                              <InfoItem key={index} iconName={item.iconName} text={item.text} highlight={item.highlight}/>
                                          ))}
                                          {tournament.days && <InfoItem iconName="Calendar" text={`DÍA DE JUEGO: ${tournament.days}`}/>}
                                          {tournament.timeSlot && <InfoItem iconName="Clock" text={`HORARIOS: ${tournament.timeSlot}`}/>}
                                          </ul>
                                          
                                           <div className="my-6 h-px w-full bg-border"></div>

                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-2">
                                              <h3 className="font-semibold flex items-center gap-2 text-lg"><DollarSign className="w-5 h-5 text-accent"/>Costos</h3>
                                              <p className="text-muted-foreground">INSCRIPCIÓN: <span className="font-bold text-foreground">{tournament.costs.inscription}</span></p>
                                              <p className="text-muted-foreground">PARTIDO: <span className="font-bold text-foreground">{tournament.costs.match}</span></p>
                                          </div>

                                          <div className="space-y-2">
                                              <h3 className="font-semibold flex items-center gap-2 uppercase text-lg"><Info className="w-5 h-5 text-accent"/>Formato</h3>
                                              {tournament.format.map((line, index) => (
                                                  <p key={index} className="text-muted-foreground uppercase">{line}</p>
                                              ))}
                                          </div>
                                          </div>

                                           <div className="my-6 h-px w-full bg-border"></div>

                                           <div className="flex flex-col items-start gap-2">
                                              <h3 className="font-semibold flex items-center gap-2 text-lg"><Smartphone className="w-5 h-5 text-accent"/>Contacto</h3>
                                              <p className="text-muted-foreground">{tournament.contact.name}: <span className="font-bold text-foreground">{tournament.contact.phone}</span> ☎️📞</p>
                                              <p className="text-sm font-bold text-accent pt-2">{tournament.note}</p>
                                          </div>
                                      </div>
                                   </div>
                              </DialogContent>
                          </Dialog>
                          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                              <Link
                                  href={`/tournament/register?tournamentName=${encodeURIComponent(tournament.title)}`}>
                                  {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                                  }
                                  <PenLine className="mr-2 h-4 w-4"/>INSCRIBIRME
                                                                </Link>
                          </Button>
                      </CardFooter>
                  </Card>
              ))}
            </div>

              {isAdmin && (
              <div className="fixed bottom-24 right-6 z-10">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="rounded-full h-14 w-14 shadow-lg bg-accent hover:bg-accent/90" size="icon">
                          <PlusCircle className="h-7 w-7" />
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Agregar Nueva Tarjeta de Torneo</DialogTitle>
                          <DialogDescription>
                              Completa la información para la nueva tarjeta de torneo.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                          <div className="space-y-2">
                              <Label htmlFor="new-title">Título del Torneo</Label>
                              <Input id="new-title" placeholder="Ej: TORNEO DE VERANO" value={newTournament.title || ''} onChange={(e) => setNewTournament(prev => ({...prev, title: e.target.value}))}/>
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="new-subtitle">Subtítulo</Label>
                              <Input id="new-subtitle" placeholder="Ej: FUTBOL 8 MIXTO" value={newTournament.subtitle || ''} onChange={(e) => setNewTournament(prev => ({...prev, subtitle: e.target.value}))}/>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="new-inscription">Costo Inscripción</Label>
                                  <Input id="new-inscription" placeholder="$40.000" value={newTournament.costs?.inscription || ''} onChange={(e) => setNewTournament(prev => ({...prev, costs: {...prev.costs!, inscription: e.target.value}}))}/>
                              </div>
                              
                              <div className="space-y-2">
                                  <Label htmlFor="new-match-cost">Costo Partido</Label>
                                  <Input id="new-match-cost" placeholder="$70.000" value={newTournament.costs?.match || ''} onChange={(e) => setNewTournament(prev => ({...prev, costs: {...prev.costs!, match: e.target.value}}))}/>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="new-days">Días de Juego</Label>
                                  <Input id="new-days" placeholder="Ej: Sábados" value={newTournament.days || ''} onChange={(e) => setNewTournament(prev => ({...prev, days: e.target.value}))}/>
                              </div>
                              
                              <div className="space-y-2">
                                  <Label htmlFor="new-time-slot">Franja Horaria</Label>
                                  <Input id="new-time-slot" placeholder="14:00 a 18:00 hs" value={newTournament.timeSlot || ''} onChange={(e) => setNewTournament(prev => ({...prev, timeSlot: e.target.value}))}/>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="new-prizes">Premios</Label>
                              <Textarea id="new-prizes" placeholder="Detalla los premios para el campeón, goleador, etc." value={newTournament.prizes || ''} onChange={(e) => setNewTournament(prev => ({...prev, prizes: e.target.value}))}/>
                          </div>

                          <div className="space-y-2">
                              <Label htmlFor="new-format">Formato</Label>
                              <Textarea id="new-format" placeholder="Describe el formato del torneo." value={newTournament.format?.join('\n') || ''} onChange={(e) => setNewTournament(prev => ({...prev, format: e.target.value.split('\n')}))}/>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="new-contact-name">Nombre Contacto</Label>
                                  <Input id="new-contact-name" placeholder="Juan Pérez" value={newTournament.contact?.name || ''} onChange={(e) => setNewTournament(prev => ({...prev, contact: {...prev.contact!, name: e.target.value}}))}/>
                              </div>
                              
                              <div className="space-y-2">
                                  <Label htmlFor="new-contact-phone">Teléfono Contacto</Label>
                                  <Input id="new-contact-phone" type="tel" placeholder="1122334455" value={newTournament.contact?.phone || ''} onChange={(e) => setNewTournament(prev => ({...prev, contact: {...prev.contact!, phone: e.target.value}}))}/>
                              </div>
                          </div>
                            
                          <div className="space-y-2">
                              <Label htmlFor="new-note">Nota Final</Label>
                              <Input id="new-note" placeholder="¡No te quedes afuera!" value={newTournament.note || ''} onChange={(e) => setNewTournament(prev => ({...prev, note: e.target.value}))}/>
                          </div>
                      </div>

                       <DialogFooter>
                          <DialogClose asChild>
                              <Button type="button" variant="secondary">Cancelar</Button>
                          </DialogClose>
                          <Button type="button" onClick={handleSaveTournament}>
                              <Save className="mr-2 h-4 w-4"/>
                              Guardar Tarjeta
                          </Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
       </div>
   );
}
