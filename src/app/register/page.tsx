'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, AlertCircle, Info, CheckCircle, Edit } from 'lucide-react';

// Server Action y Hook de debounce
import { checkDni } from '@/app/actions';
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
  const [dniStepCompleted, setDniStepCompleted] = useState(false);

  // Estados para la verificación de DNI
  const [dniValue, setDniValue] = useState('');
  const debouncedDni = useDebounce(dniValue, 500);
  const [isDniChecking, setIsDniChecking] = useState(false);
  const [dniStatus, setDniStatus] = useState<'AVAILABLE' | 'USER_EXISTS' | 'GUEST_FOUND' | 'INVALID_DNI' | 'ERROR' | 'IDLE'>('IDLE');
  const [dniMessage, setDniMessage] = useState('');

  // --- NUEVO: Estado para errores de registro en el paso final ---
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset, // <-- Importamos la función reset
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '', dni: '' },
  });

  const watchedDni = watch('dni');
  useEffect(() => {
    if (dniStepCompleted) return;
    setDniValue(watchedDni);
  }, [watchedDni, dniStepCompleted]);

  // Efecto para la verificación con debounce
  useEffect(() => {
    if (dniStepCompleted) return;

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
            setDniMessage(`¡Te encontramos! Continúa para reclamar tu perfil.`);
            setValue('name', result.data.name, { shouldValidate: true });
            break;
          case 'AVAILABLE':
            setDniStatus('AVAILABLE');
            setDniMessage('DNI disponible. Puedes continuar.');
            // --- CORRECCIÓN: Limpiamos el nombre si el DNI es nuevo ---
            setValue('name', '', { shouldValidate: true });
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
  }, [debouncedDni, setValue, dniStepCompleted]);

  // --- CORRECCIÓN: Lógica de envío con manejo de errores específico ---
  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setRegistrationError(null); // Limpiamos errores previos
    try {
      const success = await registerUser(data, selectedBackground.url);
      if (success) {
        router.push('/');
      } else {
        // Este caso es poco probable si el contexto maneja bien sus errores, pero es buena práctica tenerlo.
        setRegistrationError('Ocurrió un error inesperado durante el registro.');
        setIsLoading(false);
      }
    } catch (error: any) {
        // Capturamos el error específico de Firebase o de la lógica de negocio
        setRegistrationError(error.message || 'No se pudo completar el registro.');
        setIsLoading(false);
    }
  };

  // --- CORRECCIÓN: Función para volver al paso 1, limpiando el formulario ---
  const handleBackToDniStep = () => {
    setDniStepCompleted(false);
    const currentDni = watch('dni'); // Guardamos el DNI actual
    reset({ dni: currentDni, name: '', username: '', email: '', password: '' }); // Reseteamos el formulario
  };

  const isSubmitDisabled = isLoading;
  const canProceedToNextStep = dniStatus === 'AVAILABLE' || dniStatus === 'GUEST_FOUND';

  const getDniMessageComponent = () => {
    if (isDniChecking) {
        return <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="h-4 w-4 animate-spin" /> Verificando DNI...</p>
    }
    if(!dniMessage) return null;
    // ... (sin cambios en este componente visual)
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
              {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
              }
              <Image src="/sudone-titulo.png" alt="SUDONE Logo" fill priority sizes="200px" style={{ objectFit: 'contain' }} />
            </Link>
        </div>
        <Card>
          {/* MODIFICADO: Ahora el handleSubmit envuelve todo el formulario y gestiona la validación al final */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{dniStepCompleted ? 'Completa tu Perfil' : 'Crea tu Cuenta'}</CardTitle>
              <CardDescription>{dniStepCompleted ? 'Ya casi estamos, solo faltan tus datos.' : 'Empecemos por tu DNI para verificar tu identidad.'}</CardDescription>
            </CardHeader>
            <TooltipProvider delayDuration={150}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Tooltip>
                          <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent><p>Debe contener 8 dígitos.</p></TooltipContent>
                        </Tooltip>
                    </div>
                    {dniStepCompleted && (
                        <Button variant="ghost" size="sm" onClick={handleBackToDniStep} className="flex items-center gap-1 text-xs h-auto py-1 px-2">
                            <Edit className="h-3 w-3" /> Cambiar
                        </Button>
                    )}
                  </div>
                  <Input id="dni" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8} {...register('dni')} readOnly={dniStepCompleted} />
                  {errors.dni && !dniStepCompleted && (<p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-4 w-4" />{errors.dni.message}</p>)}
                  {!dniStepCompleted && getDniMessageComponent()}
                </div>

                {dniStepCompleted && (
                  <>
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
                        <Label>Elige tu Equipo de Hincha</Label>
                        <div className="grid grid-cols-3 gap-2"> {backgrounds.map(bg => (<button key={bg.name} type="button" onClick={() => setSelectedBackground(bg)} className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${selectedBackground.name === bg.name ? 'border-primary' : 'border-transparent'}`}><Image src={bg.crest} alt={bg.name} width={40} height={40} /><span className="text-xs mt-1">{bg.name}</span></button>))} </div>
                    </div>
                  </>
                )}
              </CardContent>
            </TooltipProvider>
            <CardFooter className="flex flex-col gap-4">
              {!dniStepCompleted ? (
                <Button type="button" className="w-full" disabled={!canProceedToNextStep} onClick={() => setDniStepCompleted(true)}>
                  Continuar
                </Button>
              ) : (
                <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrarme y Finalizar
                </Button>
              )}
              {/* --- NUEVO: Contenedor para mostrar errores de registro --- */}
              {registrationError && (
                  <div className="text-sm font-medium text-destructive flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <p>{registrationError}</p>
                  </div>
              )}
              {Object.keys(errors).length > 0 && dniStepCompleted && (
                  <div className="text-sm font-medium text-destructive flex flex-col items-start gap-1 mt-2 p-2 bg-destructive/10 rounded-md">
                      <p className='font-bold flex items-center gap-2'><AlertCircle className="h-4 w-4"/> Por favor, corrige los siguientes errores:</p>
                      <ul className='list-disc pl-5'>
                          {errors.name && <li>{errors.name.message}</li>}
                          {errors.username && <li>{errors.username.message}</li>}
                          {errors.email && <li>{errors.email.message}</li>}
                          {errors.password && <li>{errors.password.message}</li>}
                      </ul>
                  </div>
              )}

              <Button variant="link" asChild><Link href="/login">¿Ya tienes una cuenta? Inicia Sesión</Link></Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
