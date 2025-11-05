import { Match, Team } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import { Trophy } from 'lucide-react';

// --- Tipos de Datos Adaptados ---
interface TeamInfo {
  id: string;
  name: string;
  logoUrl?: string;
  score?: number | null;
}

interface Matchup {
  id: string;
  home: TeamInfo;
  away: TeamInfo;
  winnerId?: string | null;
}

interface Round {
  name: string;
  matches: Matchup[];
}

interface PlayoffBracketProps {
  rounds: Round[];
}

// --- Componentes Visuales ---

const ChampionDisplay = ({ team }: { team: TeamInfo }) => {
    return (
        <div className="flex flex-col items-center justify-center w-36 sm:w-56 gap-2">
            <h4 className="text-xs sm:text-base font-semibold tracking-wider uppercase text-yellow-400 mb-2 sm:mb-4 text-center">Campeón</h4>
            <div className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg bg-secondary border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/10">
                <Trophy className="w-8 h-8 sm:w-10 sm:w-10 text-yellow-400" strokeWidth={2}/>
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 border-2 border-yellow-400">
                    {team.logoUrl && <AvatarImage src={team.logoUrl} alt={team.name} />}
                    <AvatarFallback className="text-lg font-bold">{team.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm sm:text-base font-bold text-center text-white">{team.name}</span>
            </div>
        </div>
    )
};

const TeamDisplay = ({ team, winnerId }: { team: TeamInfo, winnerId?: string | null }) => {
    const isWinnerPlaceholder = team.id.startsWith('winner-') || team.name === 'A definir';
    
    let teamClassName = "flex items-center gap-1 sm:gap-2 w-full p-1 sm:p-2 rounded-md h-8 sm:h-10";
    let scoreClassName = "font-mono text-sm sm:text-lg";

    if (isWinnerPlaceholder) {
        teamClassName += " bg-secondary/50";
    } else if (winnerId) {
        if (winnerId === team.id) {
            teamClassName += " bg-secondary font-bold text-white";
            scoreClassName += " text-white";
        } else {
            teamClassName += " bg-secondary text-muted-foreground opacity-60";
            scoreClassName += " text-muted-foreground";
        }
    } else {
        teamClassName += " bg-secondary";
    }

    if (isWinnerPlaceholder) {
        return (
            <div className={teamClassName}>
                <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/50 text-muted-foreground font-bold text-xs sm:text-sm">?</div>
                <span className="text-xs sm:text-sm font-medium truncate text-muted-foreground italic">{team.name}</span>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-between gap-1 sm:gap-2 w-full bg-secondary p-1 sm:p-2 rounded-md h-8 sm:h-10">
            <div className="flex items-center gap-1 sm:gap-2 truncate">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    {team.logoUrl && <AvatarImage src={team.logoUrl} alt={team.name} />}
                    <AvatarFallback className="text-[10px] sm:text-xs">{team.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-medium truncate">{team.name}</span>
            </div>
            <span className={scoreClassName}>{team.score ?? "-"}</span>
        </div>
    );
};

const MatchupCard = ({ matchup }: { matchup: Matchup }) => (
    <div className="w-full space-y-0.5">
        <TeamDisplay team={matchup.home} winnerId={matchup.winnerId} />
        <div className="flex items-center justify-center py-0.5">
            <span className="text-[10px] font-bold text-muted-foreground/60">VS</span>
        </div>
        <TeamDisplay team={matchup.away} winnerId={matchup.winnerId} />
    </div>
);

const MatchupPair = ({ pair }: { pair: Matchup[] }) => {
    return (
        <div className="relative flex flex-col justify-center items-center">
            <MatchupCard matchup={pair[0]} />
            <div className="h-4 sm:h-8" />
            <MatchupCard matchup={pair[1]} />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full h-[calc(50%+1rem)] sm:h-[calc(50%+2rem)] w-4 sm:w-8 border-r border-y border-border-soft rounded-r-md" />
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 sm:translate-x-8 w-2 sm:w-4 h-px bg-border-soft" />
        </div>
    );
};

const RoundColumn = ({ round }: { round: Round }) => {
    const matchupPairs = useMemo(() => {
        const pairs: Matchup[][] = [];
        for (let i = 0; i < round.matches.length; i += 2) {
            pairs.push(round.matches.slice(i, i + 2));
        }
        return pairs;
    }, [round.matches]);

    return (
        <div className="flex flex-col justify-around items-center w-32 sm:w-56 h-full min-h-full">
            <h4 className="text-xs sm:text-base font-semibold tracking-wider uppercase text-muted-foreground mb-4 sm:mb-6 text-center">{round.name}</h4>
            <div className="flex flex-col justify-around h-full w-full">
                {matchupPairs.map((pair, index) => {
                    if (pair.length === 1) {
                        return (
                            <div key={index} className="flex justify-center items-center h-full">
                                <MatchupCard matchup={pair[0]} />
                            </div>
                        );
                    }
                    return <MatchupPair key={index} pair={pair} />;
                })}
            </div>
        </div>
    );
};

// --- Componente Principal ---
export function PlayoffBracket({ rounds }: PlayoffBracketProps) {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No se han generado los playoffs para este torneo.
      </div>
    );
  }

  const finalRound = rounds.length > 0 ? rounds[rounds.length - 1] : undefined;
  const finalMatch = finalRound && finalRound.matches.length === 1 ? finalRound.matches[0] : undefined;
  const champion = finalMatch && finalMatch.winnerId 
    ? (finalMatch.home.id === finalMatch.winnerId ? finalMatch.home : finalMatch.away)
    : null;

  return (
    <div className="flex items-stretch justify-center space-x-4 sm:space-x-12 overflow-x-auto p-4">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="flex items-center">
           <RoundColumn round={round} />
        </div>
      ))}
      {champion && (
          <div className="flex items-center pl-4 sm:pl-8">
               <div className="w-4 sm:w-8 h-px bg-border-soft" />
               <div className="pl-4 sm:pl-8">
                  <ChampionDisplay team={champion} />
               </div>
          </div>
      )}
    </div>
  );
}
