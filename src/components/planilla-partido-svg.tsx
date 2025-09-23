'use client';
import React, { forwardRef } from 'react';

interface Player {
  id: string;
  name: string;
  lastName: string;
  dni: string;
}

interface PlanillaProps {
  homeTeam?: string;
  awayTeam?: string;
  matchId?: string;
  qrCodeUrl?: string;
  homeRoster?: Player[];
  awayRoster?: Player[];
}

export const PlanillaPartidoSVG = forwardRef<HTMLDivElement, PlanillaProps>(({ homeTeam = "Equipo Local", awayTeam = "Equipo Visitante", matchId, qrCodeUrl, homeRoster = [], awayRoster = [] }, ref) => {
    
    const PlayerRow = ({ index, player }: { index: number, player?: Player }) => {
        const playerName = player ? `${player.name} ${player.lastName}` : '';
        return (
            <>
                <text x="25" y={217 + index * 25} fontFamily="Arial" fontSize="12" textAnchor="middle">{index + 1}</text>
                <text x="45" y={217 + index * 25} fontFamily="Arial" fontSize="12">{playerName}</text>
            </>
        );
    };

    return (
        <div ref={ref} style={{ width: '890px', height: '1131px', backgroundColor: 'white' }}>
            <svg width="890" height="1131" viewBox="0 0 890 1131" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <rect width="890" height="1131" fill="white" />

                {/* Header */}
                <rect x="10" y="10" width="870" height="80" stroke="black" fill="#f0f0f0" />
                <text x="445" y="45" fontFamily="Arial" fontSize="24" fontWeight="bold" textAnchor="middle">Planilla de Partido</text>
                <text x="445" y="75" fontFamily="Arial" fontSize="16" textAnchor="middle">SUDONE Torneos</text>
                
                {/* QR Code and Match ID */}
                {qrCodeUrl && <image href={qrCodeUrl} x="800" y="15" height="70" width="70" />}
                <text x="15" y="30" fontFamily="monospace" fontSize="10">ID: {matchId || 'NO-ID'}</text>


                {/* Match Info */}
                <rect x="10" y="100" width="870" height="50" stroke="black" fill="#fafafa" />
                <text x="30" y="130" fontFamily="Arial" fontSize="14">Fecha:</text>
                <line x1="80" y1="132" x2="180" y2="132" stroke="black" />
                <text x="210" y="130" fontFamily="Arial" fontSize="14">Cancha:</text>
                <line x1="270" y1="132" x2="400" y2="132" stroke="black" />
                <text x="430" y="130" fontFamily="Arial" fontSize="14">Árbitro:</text>
                <line x1="490" y1="132" x2="620" y2="132" stroke="black" />
                <text x="650" y="130" fontFamily="Arial" fontSize="14">Resultado Final:</text>
                <line x1="760" y1="132" x2="870" y2="132" stroke="black" />
                
                {/* Team Headers */}
                <rect x="10" y="160" width="430" height="40" stroke="black" fill="#e0e0e0" />
                <text x="225" y="185" fontFamily="Arial" fontSize="16" fontWeight="bold" textAnchor="middle">{homeTeam}</text>

                <rect x="450" y="160" width="430" height="40" stroke="black" fill="#e0e0e0" />
                <text x="665" y="185" fontFamily="Arial" fontSize="16" fontWeight="bold" textAnchor="middle">{awayTeam}</text>

                {/* Home Team Table Header */}
                <text x="25" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">N°</text>
                <text x="195" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">Nombre del Jugador</text>
                <text x="375" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">G</text>
                <text x="405" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">A</text>
                <text x="435" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">R</text>
                
                {/* Away Team Table Header */}
                <text x="465" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">N°</text>
                <text x="635" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">Nombre del Jugador</text>
                <text x="815" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">G</text>
                <text x="845" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">A</text>
                <text x="875" y="195" fontFamily="Arial" fontSize="10" textAnchor="middle">R</text>

                {/* Player Rows */}
                {Array.from({ length: 11 }).map((_, i) => (
                    <React.Fragment key={`player-row-${i}`}>
                        {/* Home Team Row */}
                        <rect x="10" y={200 + i * 25} width="30" height="25" fill="#f0f0f0" stroke="#ccc" />
                        <rect x="40" y={200 + i * 25} width="320" height="25" stroke="#ccc" fill="white" />
                        <rect x="360" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                        <rect x="390" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                        <rect x="420" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                        <PlayerRow index={i} player={homeRoster[i]} />


                        {/* Away Team Row */}
                        <rect x="450" y={200 + i * 25} width="30" height="25" fill="#f0f0f0" stroke="#ccc" />
                        <rect x="480" y={200 + i * 25} width="320" height="25" stroke="#ccc" fill="white" />
                        <rect x="800" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                        <rect x="830" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                        <rect x="860" y={200 + i * 25} width="30" height="25" stroke="#ccc" fill="white" />
                         <PlayerRow index={i} player={awayRoster[i]} />
                    </React.Fragment>
                ))}
                
                {/* Totals */}
                <rect x="10" y="475" width="350" height="30" stroke="black" fill="#e0e0e0" />
                <text x="185" y="495" fontFamily="Arial" fontSize="14" fontWeight="bold" textAnchor="middle">TOTALES</text>
                <rect x="360" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="390" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="420" y="475" width="30" height="30" stroke="black" fill="white" />

                <rect x="450" y="475" width="350" height="30" stroke="black" fill="#e0e0e0" />
                <text x="625" y="495" fontFamily="Arial" fontSize="14" fontWeight="bold" textAnchor="middle">TOTALES</text>
                <rect x="800" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="830" y="475" width="30" height="30" stroke="black" fill="white" />
                <rect x="860" y="475" width="30" height="30" stroke="black" fill="white" />

                {/* MVP & Penalty Section */}
                <rect x="10" y="520" width="870" height="50" stroke="black" fill="#fafafa" />
                <text x="30" y="550" fontFamily="Arial" fontSize="14" fontWeight="bold">MVP del Partido:</text>
                <line x1="160" y1="552" x2="450" y2="552" stroke="black" />
                <text x="470" y="550" fontFamily="Arial" fontSize="14" fontWeight="bold">Resultado Torneo de Penales:</text>
                <line x1="720" y1="552" x2="870" y2="552" stroke="black" />


                {/* Observations */}
                <text x="10" y="590" fontFamily="Arial" fontSize="14" fontWeight="bold">Observaciones:</text>
                <rect x="10" y="600" width="870" height="150" stroke="black" fill="white" />
                
                 {/* AI Instructions Box */}
                <g>
                    <rect x="20" y="610" width="260" height="95" stroke="#aaa" strokeDasharray="4 2" fill="#fafafa" rx="5" />
                    <text x="150" y="625" fontFamily="Arial" fontSize="12" fontWeight="bold" textAnchor="middle">Instrucciones Carga IA</text>
                    <text x="25" y="645" fontFamily="Arial" fontSize="11" fill="#333">· Goles (G): Anotar número.</text>
                    <text x="25" y="660" fontFamily="Arial" fontSize="11" fill="#333">· Tarjetas (A/R): Marcar con "X".</text>
                    <text x="25" y="675" fontFamily="Arial" fontSize="11" fill="#333">· MVP: Escribir nombre del jugador.</text>
                    <text x="25" y="690" fontFamily="Arial" fontSize="11" fill="#333">· Torneo de Penales: Anotar resultado (Ej: 2-1).</text>
                </g>

                {/* Signatures */}
                <line x1="50" y1="850" x2="350" y2="850" stroke="black" />
                <text x="200" y="870" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma Capitán Local</text>

                <line x1="540" y1="850" x2="840" y2="850" stroke="black" />
                <text x="690" y="870" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma Capitán Visitante</text>

                <line x1="295" y1="950" x2="595" y2="950" stroke="black" />
                <text x="445" y="970" fontFamily="Arial" fontSize="12" textAnchor="middle">Firma del Árbitro</text>

                {/* Footer */}
                <text x="445" y="1050" fontFamily="Arial" fontSize="10" textAnchor="middle" fill="#555">
                    Planilla generada por SUDONE - Pasión por el fútbol.
                </text>
            </svg>
        </div>
    );
});

PlanillaPartidoSVG.displayName = 'PlanillaPartidoSVG';
    