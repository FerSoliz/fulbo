'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Palette,
  Users,
  Shirt,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const PlayerInput = ({
  playerNumber,
  formData,
  handlePlayerChange,
}: {
  playerNumber: number;
  formData: any;
  handlePlayerChange: any;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="space-y-2">
      <Label htmlFor={`player-name-${playerNumber}`}>Nombre y Apellido</Label>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-muted-foreground" />
        <Input
          id={`player-name-${playerNumber}`}
          name="name"
          placeholder="Ej: Lionel Messi"
          value={formData.name}
          onChange={(e) => handlePlayerChange(playerNumber - 1, e)}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`player-dni-${playerNumber}`}>DNI</Label>
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <Input
          id={`player-dni-${playerNumber}`}
          name="dni"
          placeholder="Ej: 40123456"
          value={formData.dni}
          onChange={(e) => handlePlayerChange(playerNumber - 1, e)}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`player-dob-${playerNumber}`}>Fecha de Nacimiento</Label>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Input
          id={`player-dob-${playerNumber}`}
          name="dob"
          type="date"
          value={formData.dob}
          onChange={(e) => handlePlayerChange(playerNumber - 1, e)}
        />
      </div>
    </div>
  </div>
);

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentName = searchParams.get('tournamentName');
  const [isClient, setIsClient] = useState(false);

  const [formData, setFormData] = useState({
    teamName: '',
    teamColor1: '#000000',
    teamColor2: '#FFFFFF',
    delegateName: '',
    delegatePhone: '',
    delegateDni: '',
    captainName: '',
    captainPhone: '',
    players: Array(11).fill({ name: '', dni: '', dob: '' }),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlayerChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newPlayers = [...formData.players];
    newPlayers[index] = { ...newPlayers[index], [name]: value };
    setFormData((prev) => ({ ...prev, players: newPlayers }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClient) {
      const inscriptionId = `inscription-${Date.now()}`;
      const dataToStore = {
        ...formData,
        tournamentName: tournamentName || 'Torneo General',
      };
      sessionStorage.setItem(inscriptionId, JSON.stringify(dataToStore));
      router.push(`/tournament/register/sheet/${inscriptionId}`);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando formulario...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/tournament">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Torneos
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Formulario de Inscripción</CardTitle>
          <CardDescription>
            Inscripción para el torneo:{' '}
            <span className="font-semibold text-accent">{tournamentName}</span>
            . Completa todos los datos para generar tu planilla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Accordion type="multiple" defaultValue={['item-1']}>
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <Users className="mr-2" /> Datos del Equipo
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Nombre del Equipo</Label>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="teamName"
                          name="teamName"
                          placeholder="Ej: Los Cracks FC"
                          value={formData.teamName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="teamColor1">Color 1</Label>
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="teamColor1"
                            name="teamColor1"
                            type="color"
                            value={formData.teamColor1}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teamColor2">Color 2</Label>
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="teamColor2"
                            name="teamColor2"
                            type="color"
                            value={formData.teamColor2}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <User className="mr-2" /> Datos del Delegado
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delegateName">Nombre y Apellido</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="delegateName"
                          name="delegateName"
                          placeholder="Ej: Juan Pérez"
                          value={formData.delegateName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delegatePhone">Celular</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="delegatePhone"
                          name="delegatePhone"
                          type="tel"
                          placeholder="Ej: 1122334455"
                          value={formData.delegatePhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delegateDni">DNI</Label>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="delegateDni"
                          name="delegateDni"
                          placeholder="Ej: 30123456"
                          value={formData.delegateDni}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <User className="mr-2" /> Datos del Capitán
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="captainName">Nombre y Apellido</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="captainName"
                          name="captainName"
                          placeholder="Ej: Pedro González"
                          value={formData.captainName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="captainPhone">Celular</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <Input
                          id="captainPhone"
                          name="captainPhone"
                          type="tel"
                          placeholder="Ej: 1166778899"
                          value={formData.captainPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <Shirt className="mr-2" /> Lista de Jugadores (Buena Fe)
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {formData.players.map((player, index) => (
                    <div key={index}>
                      <h4 className="font-semibold mb-2">
                        Jugador {index + 1}
                      </h4>
                      <PlayerInput
                        playerNumber={index + 1}
                        formData={player}
                        handlePlayerChange={handlePlayerChange}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Generar Planilla de Inscripción
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RegisterPageContent />
        </Suspense>
    )
}

    