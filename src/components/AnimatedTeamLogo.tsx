// src/components/AnimatedTeamLogo.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AnimatedTeamLogoProps {
  name: string;
  logoUrl?: string;
  className?: string; // Para aplicar estilos adicionales al contenedor
}

const AnimatedTeamLogo: React.FC<AnimatedTeamLogoProps> = ({ name, logoUrl, className }) => {
  const containerSizePx = 128; // h-32 w-32 equivale a 128px
  const avatarSizePx = 112;   // h-28 w-28 equivale a 112px
  const borderThicknessPx = 1; // Grosor deseado del borde animado en píxeles

  // Calcular los radios para que la máscara cree un borde de 1px justo alrededor del Avatar
  const avatarRadiusPx = avatarSizePx / 2; // 56px
  
  // El punto donde el transparente interior termina y el borde visible (negro en la máscara) empieza
  const maskInnerTransparentEnd = avatarRadiusPx - borderThicknessPx; // 55px
  
  // El punto donde el borde visible (negro) termina y el transparente exterior empieza
  const maskBlackEnd = avatarRadiusPx; // 56px

  return (
    <div className={`relative group w-32 h-32 flex items-center justify-center rounded-full
                    transition-all duration-300 ease-in-out
                    hover:scale-110 hover:shadow-2xl hover:shadow-primary/50
                    transform hover:-translate-y-2 ${className}
                    overflow-hidden`} // Crucial para que la máscara funcione
      style={{
        '--angle': '0deg', // Inicializar variable CSS para la animación
      } as React.CSSProperties}
    >
      {/* El div que contiene el gradiente animado y la máscara */}
      <div 
        className="absolute inset-0 rounded-full z-0 animate-border-spin"
        style={{
          background: `conic-gradient(from var(--angle), hsl(var(--primary)) 0%, hsl(var(--accent)) 30%, transparent 60%, transparent 100%)`,
          mask: `radial-gradient(circle at center, transparent ${maskInnerTransparentEnd}px, black ${maskBlackEnd}px, transparent ${maskBlackEnd + 0.5}px)`,
          WebkitMask: `radial-gradient(circle at center, transparent ${maskInnerTransparentEnd}px, black ${maskBlackEnd}px, transparent ${maskBlackEnd + 0.5}px)`, // Para compatibilidad
        } as React.CSSProperties}
      ></div>
      
      {/* Contenido principal: Avatar sin bordes, posicionado sobre la máscara */}
      <Avatar className="h-28 w-28 relative z-10 border-transparent"> {/* z-10 y sin bordes */} 
        <AvatarImage src={logoUrl || '/placeholder-team.png'} alt={`${name} logo`} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* Elemento para la animación de brillo interno del logo */}
      <div 
        className="absolute inset-[5px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shine transition-opacity duration-300"
        aria-hidden="true"
      ></div>
    </div>
  );
};

export default AnimatedTeamLogo;
