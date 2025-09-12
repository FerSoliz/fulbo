'use client';
import React, { forwardRef } from 'react';

interface PlanillaProps {
  homeTeam?: string;
  awayTeam?: string;
}

export const PlanillaPartidoSVG = forwardRef<HTMLDivElement, PlanillaProps>(({ homeTeam = "Equipo Local", awayTeam = "Equipo Visitante" }, ref) => {
    
    const PlayerRow = ({ index }: { index: number }) => (
        <>
            <rect x="10" y={200 + index * 25} width="30" height="25" fill="#f0f0f0" stroke="#ccc" />
            <text x="25" y={217 + index * 25} fontFamily="Arial" fontSize="12" textAnchor="middle">{index + 1}</text>
            <rect x="40" y={200 + index * 25} width="160" height="25" stroke="#ccc" fill="white" />
            <rect x="200" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />
            <rect x="230" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />
            <rect x="260" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />

            {/* Away team */}
            <rect x="500" y={200 + index * 25} width="30" height="25" fill="#f0f0f0" stroke="#ccc" />
            <text x="515" y={217 + index * 25} fontFamily="Arial" fontSize="12" textAnchor="middle">{index + 1}</text>
            <rect x="530" y={200 + index * 25} width="160" height="25" stroke="#ccc" fill="white" />
            <rect x="690" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />
            <rect x="720" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />
            <rect x="750" y={200 + index * 25} width="30" height="25" stroke="#ccc" fill="white" />
        </>
    );

    return (
        <div ref={ref} style={{ width: '800px', height: '1131px', backgroundColor: 'white' }}>
            <svg width="800" height="1131" viewBox="0 0 800 1131" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="1131" fill="white" />

                {/* Header */}
                <rect x="10" y="10" width="780" height="80" stroke="black" fill="#f0f0f0" />
                <text x="400" y="45" fontFamily="Arial" fontSize="24" fontWeight="bold" textAnchor="middle">Planilla de Partido</text>
                <text x="400" y="75" fontFamily="Arial" fontSize="16" textAnchor="middle">SUDONE Torneos</text>

                {/* Match Info */}
                <rect x="10" y="100" width="780" height="50" stroke="black" fill="#fafafa" />
                <text x="30" y="130" fontFamily="Arial" fontSize="14">Fecha:</text>
                <line x1="70" y1="132" x2="170" y2="132" stroke="black" />
                <text x="200" y="130" fontFamily="Arial" fontSize="14">Cancha:</text>
                <line x1="250" y1="132" x2="350" y2="132" stroke="black" />
                <text x="380" y="130" fontFamily="Arial" fontSize="14">Árbitro:</text>
                <line x1="430" y1="132" x2="550" y2="132" stroke="black" />
                <text x="580" y="130" fontFamily="Arial" fontSize="14">Resultado Final:</text>
                <line x1="680" y1="132" x2="780" y2="132" stroke="black" />
                
                {/* Team Headers */}
                <rect x="10" y="160" width="385" height="40" stroke="black" fill="#e0e0e0" />
                <text x="202.5" y="185" fontFamily="Arial" fontSize="16" fontWeight="bold" textAnchor="middle">{homeTeam}</text>

                <rect x="405" y="160" width="385" height="40" stroke="black" fill="#e0e0e0" />
                <text x="597.5" y="185" fontFamily="Arial" fontSize="16" fontWeight="bold" textAnchor="middle">{awayTeam}</text>

                {/* Home Team Table Header */}
                <text x="25" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">N°</text>
                <text x="120" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">Nombre del Jugador</text>
                <text x="215" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">G</text>
                <text x="245" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">A</text>
                <text x="275" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">R</text>
                
                {/* Away Team Table Header */}
                <text x="515" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">N°</text>
                <text x="610" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">Nombre del Jugador</text>
                <text x="705" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">G</text>
                <text x="735" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">A</text>
                <text x="765" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">R</text>

                {/* Player Rows */}
                {Array.from({ length: 11 }).map((_, i) => <PlayerRow key={`player-row-${i}`} index={i} />)}
                
                {/* Totals */}
                <rect x="10" y="475" width="190" height="30" stroke="black" fill="#e0e0e0" />
                <text x="105" y="495" fontFamily="Arial" fontSize="14" fontWeight="bold" textAnchor="middle">TOTALES</text>
                <rect x="200" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="230" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="260" y="475" width="30" height="30" stroke="black" fill="white" />

                <rect x="500" y="475" width="190" height="30" stroke="black" fill="#e0e0e0" />
                <text x="595" y="495" fontFamily="Arial" fontSize="14" fontWeight="bold" textAnchor="middle">TOTALES</text>
                <rect x="690" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="720" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="750" y="475" width="30" height="30" stroke="black" fill="white" />

                {/* MVP Section */}
                <rect x="10" y="520" width="780" height="50" stroke="black" fill="#fafafa" />
                <text x="30" y="550" fontFamily="Arial" fontSize="14" fontWeight="bold">MVP del Partido:</text>
                <line x1="150" y1="552" x2="400" y2="552" stroke="black" />

                {/* Observations */}
                <text x="10" y="590" fontFamily="Arial" fontSize="14" fontWeight="bold">Observaciones:</text>
                <rect x="10" y="600" width="780" height="150" stroke="black" fill="white" />
                
                {/* Signatures */}
                <line x1="50" y1="850" x2="300" y2="850" stroke="black" />
                <text x="175" y="870" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma Capitán Local</text>

                <line x1="500" y1="850" x2="750" y2="850" stroke="black" />
                <text x="625" y="870" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma Capitán Visitante</text>

                <line x1="275" y1="950" x2="525" y2="950" stroke="black" />
                <text x="400" y="970" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma del Árbitro</text>

                {/* Footer */}
                <text x="400" y="1050" fontFamily="Arial" fontSize="10" textAnchor="middle" fill="#555">
                    Planilla generada por SUDONE - Pasión por el fútbol.
                </text>
            </svg>
        </div>
    );
});

PlanillaPartidoSVG.displayName = 'PlanillaPartidoSVG';
