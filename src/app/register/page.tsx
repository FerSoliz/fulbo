'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Importaciones de React Hook Form y Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validators'; 

// Componentes de UI y Contexto
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Info, CheckCircle, Search } from 'lucide-react';

// --- ¡NUEVO! --- Importamos la Server Action
import { checkDni } from '@/app/actions';
// Hook para el "debounce"
import { useDebounce } from '@/hooks/use-debounce';

const backgrounds = [
    { name: 'AFA', url: '/lusail.png', crest: '/escudito-afa.png' },
    { name: 'River Plate', url: '/ELMONUMENTALRIVERPLATE2.png', crest: '/escudito-river.png' },
    { name: 'Boca Juniors', url: '/LABOMBONERABOCAJUNIORS.jpg', crest: '/escudito-de-boca.png' }
];

export default function RegisterPage() {
  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0]);
  const { register: registerUser } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // --- ¡NUEVO! --- Estados para la verificación de DNI en tiempo real
  const [dniValue, setDniValue] = useState('');
  const debouncedDni = useDebounce(dniValue, 500); // 500ms de espera
  const [isDniChecking, setIsDniChecking] = useState(false);
  const [dniStatus, setDniStatus] = useState<'AVAILABLE' | 'USER_EXISTS' | 'GUEST_FOUND' | 'INVALID_DNI' | 'ERROR' | 'IDLE'>('IDLE');
  const [dniMessage, setDniMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue, // Para autocompletar el nombre
    watch,    // Para observar cambios en el DNI
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '', dni: '' },
  });

  // Observamos el valor del DNI del formulario y lo pasamos al estado local
  const watchedDni = watch('dni');
  useEffect(() => {
    setDniValue(watchedDni);
  }, [watchedDni]);

  // --- ¡NUEVO! --- Efecto para la verificación con debounce
  useEffect(() => {
    // Solo verificamos si el DNI tiene 8 dígitos
    if (debouncedDni && /^\d{8}$/.test(debouncedDni)) {
      const verifyDni = async () => {
        setIsDniChecking(true);
        setDniMessage('');
        const result = await checkDni(debouncedDni);
        
        switch(result.status) {
          case 'USER_EXISTS':
            setDniStatus('USER_EXISTS');
            setDniMessage('Ya existe una cuenta registrada con este DNI.');
            break;
          case 'GUEST_FOUND':
            setDniStatus('GUEST_FOUND');
            setDniMessage(`¡Te encontramos! Completa el registro para reclamar tu perfil.`);
            setValue('name', result.data.name, { shouldValidate: true }); // Autocompletamos el nombre
            break;
          case 'AVAILABLE':
            setDniStatus('AVAILABLE');
            setDniMessage('DNI disponible.');
            break;
          case 'INVALID_DNI':
          case 'ERROR':
            setDniStatus('ERROR');
            setDniMessage(result.status === 'ERROR' ? result.message : 'El DNI debe tener 8 dígitos.');
            break;
        }
        setIsDniChecking(false);
      };
      verifyDni();
    } else {
      setDniStatus('IDLE');
      setDniMessage('');
    }
  }, [debouncedDni, setValue]);

  const onSubmit = async (data: RegisterInput) => {
    // Ya no es necesario pasar el DNI aquí, la función de registro lo obtendrá del objeto data.
    setIsLoading(true);
    const success = await registerUser(data, selectedBackground.url);
    if (success) {
      router.push('/');
    } else {
        setIsLoading(false);
    }
  };

  // El formulario se deshabilita si el DNI ya está en uso o si hay un error.
  const isSubmitDisabled = isLoading || dniStatus === 'USER_EXISTS' || dniStatus === 'ERROR';

  const getDniMessageComponent = () => {
    if (isDniChecking) {
        return <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="h-4 w-4 animate-spin" /> Verificando DNI...</p>
    }
    if(!dniMessage) return null;

    switch(dniStatus) {
        case 'USER_EXISTS':
        case 'ERROR':
            return <p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{dniMessage}</p>
        case 'GUEST_FOUND':
        case 'AVAILABLE':
            return <p className="text-sm font-medium text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" />{dniMessage}</p>
        default:
            return null;
    }
  }

  return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6">
           <div className="flex justify-center">
              <Link href="/" className="relative w-[200px] h-[60px]">
                  <Image src="/sudone-titulo.png" alt="SUDONE Logo" fill priority sizes="200px" style={{ objectFit: 'contain' }} />
              </Link>
          </div>
          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Crea tu Cuenta</CardTitle>
                <CardDescription>Completa tus datos para unirte a SUDONE</CardDescription>
              </CardHeader>
              <TooltipProvider delayDuration={150}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre y Apellido</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.name.message}</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input id="username" {...register('username')} />
                    {errors.username && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.username.message}</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.email.message}</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" {...register('password')} />
                    {errors.password && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.password.message}</p>)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dni">DNI</Label>
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p>Debe contener 8 dígitos, sin puntos ni letras.</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="dni" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8} {...register('dni')} />
                    {errors.dni && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.dni.message}</p>)}
                    {getDniMessageComponent()}
                  </div>

                  <div className="space-y-2">
                      <Label>Elige tu Equipo</Label>
                      <div className="grid grid-cols-3 gap-2">
                          {backgrounds.map(bg => (
                              <button 
                                  key={bg.name} 
                                  type="button" 
                                  onClick={() => setSelectedBackground(bg)}
                                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${selectedBackground.name === bg.name ? 'border-primary' : 'border-transparent'}`}>
                                  <Image src={bg.crest} alt={bg.name} width={40} height={40} />
                                  <span className="text-xs mt-1">{bg.name}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                </CardContent>
              </TooltipProvider>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitDisabled}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrarme</Button>
                <Button variant="link" asChild><Link href="/login">¿Ya tienes una cuenta? Inicia Sesión</Link></Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
}
