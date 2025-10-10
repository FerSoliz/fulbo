import { ref, get, set, update, onValue, off, query, orderByChild, equalTo, remove, push, serverTimestamp, increment } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, Post, RosterPlayer, FoundPlayer, TeamDetails, Match, FullTournament, TournamentStats, Standing, Scorer, Sanction, Product, EnrichedMatch, MatchFinances } from '../types'; 

// --- TIPOS ---

export interface TeamSummary {
  id: string;
  name: string;
  logoUrl: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; 
  gc: number; 
  dg: number; 
  points: number;
  crestUrl?: string; 
}

export interface PlayerStats {
  playerInfo: { id: string, name: string, lastName?: string };
  teamId: string;
  teamName: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

// --- FUNCIONES DE DATOS ESPECÍFICAS ---

export const getTeamDetails = async (teamId: string): Promise<TeamDetails | null> => {
  try {
    const teamRef = ref(db, `teams/${teamId}`);
    const snapshot = await get(teamRef);

    if (!snapshot.exists()) {
      return null;
    }

    const teamData = snapshot.val();
    return {
      id: snapshot.key!,
      name: teamData.name,
      logoUrl: teamData.logoUrl,
      captainId: teamData.captainId,
    };
  } catch (error) {
    console.error('Error al obtener los detalles del equipo:', error);
    return null;
  }
};

export const findUserByDni = async (dni: string): Promise<FoundPlayer | null> => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('dni'), equalTo(dni));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        let foundUser: FoundPlayer | null = null;
        snapshot.forEach((childSnapshot) => {
        const userData: UserProfile = childSnapshot.val();
        if (!foundUser) {
            foundUser = {
            id: childSnapshot.key!,
            name: userData.name,
            dni: userData.dni,
            username: userData.username,
            avatar: userData.avatar,
            isGuest: false,
            team: userData.team || null, 
            };
        }
        });
        return foundUser;
    }
    
    const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
    const guestSnapshot = await get(guestPlayerRef);
    if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return {
            id: guestSnapshot.key!,
            name: guestData.name,
            dni: guestData.dni,
            username: 'invitado', 
            isGuest: true,
            team: guestData.team || null,
        };
    }

    return null;
  } catch (error) {
    console.error('Error al buscar usuario por DNI:', error);
    return null;
  }
};


// --- FUNCIONES PARA GESTIÓN DE PLANTILLA (ROSTER) ---

export const getTeamRoster = async (teamId: string): Promise<RosterPlayer[]> => {
  const rosterRef = ref(db, `teams/${teamId}/players`);
  const rosterSnapshot = await get(rosterRef);

  if (!rosterSnapshot.exists()) {
    return [];
  }

  const rosterData = rosterSnapshot.val();
  const playerPromises: Promise<RosterPlayer | null>[] = Object.keys(rosterData).map(async (playerId) => {
    const playerData = rosterData[playerId];
    const isGuest = playerData.isGuest === true;

    if (isGuest) {
      const guestPlayerRef = ref(db, `guestPlayers/${playerId}`);
      const guestSnapshot = await get(guestPlayerRef);
      if (guestSnapshot.exists()) {
        const guestData = guestSnapshot.val();
        return { id: playerId, name: guestData.name, dni: guestData.dni, isGuest: true };
      }
    } else {
      const userRef = ref(db, `users/${playerId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        return { id: playerId, name: userData.name, dni: userData.dni, isGuest: false };
      }
    }
    return null;
  });

  const players = await Promise.all(playerPromises);
  return players.filter((player): player is RosterPlayer => player !== null);
};

export const addRegisteredPlayerToTeam = async (playerId: string, teamId: string): Promise<boolean> => {
  try {
    const playerRef = ref(db, `users/${playerId}`);
    const playerSnapshot = await get(playerRef);
    if (!playerSnapshot.exists()) throw new Error("El jugador no existe.");

    const playerData = playerSnapshot.val();
    const oldTeamId = playerData.team?.id;

    const updates: { [key: string]: any } = {};
    const teamDetails = await getTeamDetails(teamId);
    if(!teamDetails) throw new Error("El equipo de destino no existe");

    updates[`/teams/${teamId}/players/${playerId}`] = { isGuest: false };
    updates[`/users/${playerId}/team`] = { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl };

    if (oldTeamId && oldTeamId !== teamId) {
      updates[`/teams/${oldTeamId}/players/${playerId}`] = null;
    }

    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error al añadir jugador registrado:", error);
    return false;
  }
};

export const addGuestPlayerToTeam = async (name: string, dni: string, teamId: string): Promise<RosterPlayer | null> => {
  try {
    const guestPlayerId = dni;
    const guestPlayerRef = ref(db, `guestPlayers/${guestPlayerId}`);
    const guestSnapshot = await get(guestPlayerRef);

    const updates: { [key: string]: any } = {};

    if (guestSnapshot.exists()) {
      const guestData = guestSnapshot.val();
      const oldTeamId = guestData.team?.id;
      if (oldTeamId && oldTeamId !== teamId) {
        updates[`/teams/${oldTeamId}/players/${guestPlayerId}`] = null;
      }
    }

    const teamDetails = await getTeamDetails(teamId);
    if (!teamDetails) throw new Error("El equipo de destino no fue encontrado.");

    const newGuestData = {
      name,
      dni,
      team: { id: teamId, name: teamDetails.name, crestUrl: teamDetails.logoUrl },
      ...(!guestSnapshot.exists() && { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    };

    updates[`/guestPlayers/${guestPlayerId}`] = newGuestData;
    updates[`/teams/${teamId}/players/${guestPlayerId}`] = { isGuest: true };

    await update(ref(db), updates);

    return { id: guestPlayerId, name, dni, isGuest: true };
  } catch (error) {
    console.error("Error al añadir jugador invitado:", error);
    return null;
  }
};

export const removePlayerFromTeam = async (playerId: string, teamId: string, isGuest: boolean): Promise<boolean> => {
  try {
    const updates: { [key: string]: any } = {};
    updates[`/teams/${teamId}/players/${playerId}`] = null;

    if (isGuest) {
      updates[`/guestPlayers/${playerId}/team`] = null;
    } else {
      updates[`/users/${playerId}/team`] = null;
    }

    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error al eliminar jugador:", error);
    return false;
  }
};

export const getAllTeams = async (): Promise<TeamSummary[]> => {
    try {
        const teamsRef = ref(db, 'teams');
        const snapshot = await get(query(teamsRef, orderByChild('name')));
        if (!snapshot.exists()) return [];
        const allTeams: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const teamData = childSnapshot.val();
            allTeams.push({ id: childSnapshot.key!, name: teamData.name, logoUrl: teamData.logoUrl });
        });
        return allTeams;
    } catch (error) {
        console.error("Error fetching all teams:", error);
        return [];
    }
};

export const getAllTournaments = async (): Promise<FullTournament[]> => {
  try {
    const tournamentsRef = ref(db, 'tournaments');
    const snapshot = await get(tournamentsRef);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron torneos.");
      return [];
    }

    const tournamentsList: FullTournament[] = [];
    snapshot.forEach(childSnapshot => {
      tournamentsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return tournamentsList;
  } catch (error) {
    console.error("[DB Service] Error crítico al obtener todos los torneos:", error);
    return [];
  }
};

export const getTournamentDetails = async (tournamentId: string): Promise<FullTournament | null> => {
  console.log(`[DB Service] Obteniendo detalles enriquecidos para el torneo: ${tournamentId}`);
  try {
    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);

    const [tournamentSnapshot, statsSnapshot] = await Promise.all([
      get(tournamentRef),
      get(statsRef),
    ]);

    if (!tournamentSnapshot.exists()) {
      console.warn(`[DB Service] No se encontró el torneo con ID: ${tournamentId}`);
      return null;
    }

    const tournamentData = tournamentSnapshot.val();
    const statsData: TournamentStats | null = statsSnapshot.exists() ? statsSnapshot.val() : null;
    const teamIds = tournamentData.teams ? Object.keys(tournamentData.teams) : [];

    const teamsPromises = teamIds.map(id => get(ref(db, `teams/${id}`)));
    const teamsSnapshots = await Promise.all(teamsPromises);
    const teamsMap = teamsSnapshots.reduce((acc, snap) => {
      if (snap.exists()) {
        const team = snap.val();
        acc[snap.key!] = { name: team.name, logoUrl: team.logoUrl };
      }
      return acc;
    }, {} as { [id: string]: { name: string, logoUrl: string } });

    console.log("[DB Service] Mapa de equipos construido:", teamsMap);

    const standings: Standing[] = statsData?.positions?.map((pos, index) => ({
      rank: index + 1,
      team: teamsMap[pos.teamId]?.name || pos.teamName || 'Equipo Desconocido',
      played: pos.played,
      won: pos.won,
      drawn: pos.drawn,
      lost: pos.lost,
      points: pos.points,
      crestUrl: teamsMap[pos.teamId]?.logoUrl || ''
    })) || [];

    const scorers: Scorer[] = statsData?.scorers?.map((scorer, index) => ({
      rank: index + 1,
      player: `${scorer.playerInfo.name} ${scorer.playerInfo.lastName || ''}`.trim(),
      team: teamsMap[scorer.teamId]?.name || scorer.teamName || 'Equipo Desconocido',
      goals: scorer.goals,
    })) || [];
    
    const sanctions: Sanction[] = statsData?.sanctions?.map(sanc => ({
      player: `${sanc.playerInfo.name} ${sanc.playerInfo.lastName || ''}`.trim(),
      team: teamsMap[sanc.teamId]?.name || sanc.teamName || 'Equipo Desconocido',
      yellowCards: sanc.yellowCards,
      redCards: sanc.redCards,
    })) || [];

    const fullTournamentData: FullTournament = {
      id: tournamentSnapshot.key!,
      name: tournamentData.name,
      category: tournamentData.category,
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      venue: tournamentData.venue,
      standings,
      scorers,
      sanctions,
    };

    console.log(`[DB Service] Datos combinados y enriquecidos para ${tournamentId}:`, fullTournamentData);
    return fullTournamentData;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener los detalles del torneo ${tournamentId}:`, error);
    return null;
  }
};


export const searchTeams = async (searchText: string, excludedTeamIds: string[] = []): Promise<TeamSummary[]> => {
    if (!searchText || searchText.trim() === '') return [];
    try {
        const teamsRef = ref(db, 'teams');
        const q = query(teamsRef, orderByChild('name'));
        const snapshot = await get(q);
        if (!snapshot.exists()) return [];
        const results: TeamSummary[] = [];
        snapshot.forEach(childSnapshot => {
            const team = childSnapshot.val();
            const teamId = childSnapshot.key;
            const nameMatches = team.name.toLowerCase().includes(searchText.toLowerCase());
            const isExcluded = teamId ? excludedTeamIds.includes(teamId) : true;
            if (nameMatches && !isExcluded) {
                results.push({ id: teamId!, name: team.name, logoUrl: team.logoUrl });
            }
        });
        return results;
    } catch (error) {
        console.error("Error al buscar equipos:", error);
        return [];
    }
};

export const assignTeamToTournament = async (teamId: string, tournamentId: string): Promise<boolean> => {
    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/tournaments/${tournamentId}`] = true;
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = true;
        updates[`/tournaments/${tournamentId}/teamCount`] = increment(1);
        await update(ref(db), updates);
        return true;
    } catch (error) {
        console.error("Error assigning team to tournament:", error);
        return false;
    }
};

export const getTournamentStats = async (tournamentId: string): Promise<TournamentStats | null> => {
  try {
    const statsRef = ref(db, `tournament_stats/${tournamentId}`);
    const snapshot = await get(statsRef);
    if (snapshot.exists()) return snapshot.val() as TournamentStats;
    return null; 
  } catch (error) {
    console.error(`Error al obtener estadísticas para el torneo ${tournamentId}:`, error);
    throw new Error('No se pudieron cargar las estadísticas del torneo.');
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if(snapshot.exists()) return { id: snapshot.key, ...snapshot.val() } as UserProfile;
    return null;
};

export const getPosts = async (): Promise<Post[]> => {
    const postsRef = ref(db, 'posts');
    const snapshot = await get(query(postsRef, orderByChild('createdAt')));
    if(snapshot.exists()) {
        const postsData = snapshot.val();
        return Object.keys(postsData)
            .map(key => ({ id: key, ...postsData[key] }))
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
};

export const getMatchHistoryForTeam = async (teamId: string): Promise<Match[]> => {
  console.log(`[DB Service] Iniciando búsqueda de historial para teamId: ${teamId}`);
  try {
    const teamTournamentsRef = ref(db, `teams/${teamId}/tournaments`);
    const teamTournamentsSnap = await get(teamTournamentsRef);

    if (!teamTournamentsSnap.exists()) {
      console.log(`[DB Service] El equipo ${teamId} no está inscrito en ningún torneo.`);
      return [];
    }

    const tournamentIds = Object.keys(teamTournamentsSnap.val());
    if (tournamentIds.length === 0) return [];
    console.log(`[DB Service] Equipo ${teamId} participa en los torneos:`, tournamentIds);

    const matchesPromises = tournamentIds.map(async (tournamentId) => {
      const matchesRef = ref(db, 'matches');
      const q = query(matchesRef, orderByChild('tournamentId'), equalTo(tournamentId));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const matchesData = snapshot.val();
        const teamMatches = Object.keys(matchesData)
          .map(matchId => {
            const matchData = matchesData[matchId];
            return { ...matchData, id: matchId };
          })
          .filter(match => match.homeTeamId === teamId || match.awayTeamId === teamId);
        
        return teamMatches;
      }
      return [];
    });

    const matchesPerTournament = await Promise.all(matchesPromises);
    const allMatches = matchesPerTournament.flat();

    console.log(`[DB Service] Se encontraron un total de ${allMatches.length} partidos para el equipo ${teamId}.`);
    return allMatches;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener el historial de partidos para ${teamId}:`, error);
    return [];
  }
};

export const getUpcomingMatchesForTeam = async (teamId: string): Promise<Match[]> => {
  console.log(`[DB Service] Buscando TODOS los partidos pendientes para teamId: ${teamId}`);
  try {
    const allMatches = await getMatchHistoryForTeam(teamId);
    const pendingMatches = allMatches.filter(match => match.status === 'pending');

    if (pendingMatches.length === 0) {
      console.log(`[DB Service] No se encontraron partidos pendientes para el equipo ${teamId}.`);
      return []; 
    }

    pendingMatches.sort((a, b) => {
      const aDate = a.details?.date ? new Date(a.details.date).getTime() : 0;
      const bDate = b.details?.date ? new Date(b.details.date).getTime() : 0;
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      return aDate - bDate;
    });

    console.log(`[DB Service] Se encontraron ${pendingMatches.length} partidos pendientes.`);
    return pendingMatches;

  } catch (error) {
    console.error(`[DB Service] Error crítico al obtener los próximos partidos para ${teamId}:`, error);
    return [];
  }
};

// --- FUNCIONES PARA POSTS (PUBLICACIONES) ---

interface UserData {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

interface NewPostData {
  content?: string;
  media?: { type: 'image' | 'video'; url: string; videoType?: 'youtube' | 'twitch'; videoId?: string }[];
  url?: string | null;
  isPinned?: boolean;
  author: UserData;
}

export const createPost = async (postData: NewPostData): Promise<void> => {
  const { content, media, url, isPinned, author } = postData;

  const postToSave: any = {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorUsername: author.username,
    createdAt: serverTimestamp(),
    content: content || '',
    ...(media && { media }),
    ...(url && { url }),
    likes: {},
    comments: {},
  };

  if (isPinned) {
    postToSave.isPinned = true;
    postToSave.pinnedUntil = { '.sv': { 'timestamp': serverTimestamp() }, 'offset': 24 * 60 * 60 * 1000 };
  }

  await push(ref(db, 'posts'), postToSave);
};

export const togglePostLike = async (postId: string, user: UserData): Promise<void> => {
  const postLikeRef = ref(db, `posts/${postId}/likes/${user.id}`);
  const snapshot = await get(postLikeRef);

  if (snapshot.exists()) {
    await remove(postLikeeRef);
  } else {
    const likeData = {
      name: user.name,
      avatar: user.avatar,
      username: user.username,
    };
    await set(postLikeRef, likeData);
  }
};

export const addCommentToPost = async (postId: string, commentText: string, author: UserData): Promise<void> => {
  const commentsRef = ref(db, `posts/${postId}/comments`);
  const newCommentRef = push(commentsRef);

  const commentData = {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorUsername: author.username,
    content: commentText,
    createdAt: serverTimestamp(),
  };

  await set(newCommentRef, commentData);
};

export const findTeamByPlayer = async (userId: string): Promise<any | null> => {
  if (!userId) return null;

  try {
    const teamsRef = ref(db, 'teams');
    const teamsSnapshot = await get(teamsRef);

    if (!teamsSnapshot.exists()) {
      return null;
    }

    let foundTeam = null;
    const teamsData = teamsSnapshot.val();
    
    for (const teamId of Object.keys(teamsData)) {
      const team = teamsData[teamId];
      if (team.players && team.players[userId]) {
        foundTeam = { id: teamId, ...team };
        break; 
      }
    }

    return foundTeam;

  } catch (error) {
    console.error(`Error al buscar el equipo para el jugador ${userId}:`, error);
    return null;
  }
};

export const getRankedUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = ref(db, 'users');
    const q = query(usersRef, orderByChild('sudpoints'));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron usuarios para el ranking.");
      return [];
    }

    const usersList: UserProfile[] = [];
    snapshot.forEach(childSnapshot => {
      usersList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return usersList.reverse();

  } catch (error) {
    console.error("[DB Service] Error crítico al obtener el ranking de usuarios:", error);
    return [];
  }
};

// --- FUNCIONES PARA LA TIENDA (SUDSTORE) ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron productos en la tienda.");
      return [];
    }

    const productsList: Product[] = [];
    snapshot.forEach(childSnapshot => {
      productsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });

    return productsList;

  } catch (error) {
    console.error("[DB Service] Error crítico al obtener los productos de la tienda:", error);
    return [];
  }
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef);
  const newProduct: Product = {
    ...productData,
    id: newProductRef.key!,
  };
  await set(newProductRef, productData);
  return newProduct;
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const productRef = ref(db, `products/${productId}`);
  await update(productRef, updates);
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = ref(db, `products/${productId}`);
  await remove(productRef);
};

// --- NUEVAS FUNCIONES PARA EL MÓDULO DE CAJA ---

/**
 * Obtiene todos los partidos con estado 'finalizado' y los enriquece con datos
 * del torneo y los equipos para ser mostrados en la UI.
 * @returns Una promesa que se resuelve a un array de partidos finalizados y enriquecidos.
 */
export const getFinishedMatches = async (): Promise<EnrichedMatch[]> => {
  console.log("[DB Service] Obteniendo partidos finalizados para el módulo de caja...");
  try {
    const matchesRef = ref(db, 'matches');
    // Consulta para traer solo los partidos con status 'finalizado'
    const q = query(matchesRef, orderByChild('status'), equalTo('finished'));
    const snapshot = await get(q);

    if (!snapshot.exists()) {
      console.log("[DB Service] No se encontraron partidos finalizados.");
      return [];
    }

    const matchesData = snapshot.val();
    const finishedMatches: Match[] = Object.keys(matchesData).map(key => ({
      id: key,
      ...matchesData[key]
    }));

    // --- Enriquecimiento de Datos ---
    const teamIds = new Set<string>();
    const tournamentIds = new Set<string>();

    finishedMatches.forEach(match => {
      teamIds.add(match.homeTeamId);
      teamIds.add(match.awayTeamId);
      tournamentIds.add(match.tournamentId);
    });

    // Obtener datos de equipos y torneos en paralelo
    const teamsPromises = [...teamIds].map(id => get(ref(db, `teams/${id}`)));
    const tournamentsPromises = [...tournamentIds].map(id => get(ref(db, `tournaments/${id}`)));

    const [teamsSnapshots, tournamentsSnapshots] = await Promise.all([
      Promise.all(teamsPromises),
      Promise.all(tournamentsPromises)
    ]);

    // Crear mapas para búsqueda rápida (O(1))
    const teamsMap = new Map(teamsSnapshots.map(snap => [snap.key, snap.val()]));
    const tournamentsMap = new Map(tournamentsSnapshots.map(snap => [snap.key, snap.val()]));

    const enrichedMatches: EnrichedMatch[] = finishedMatches.map(match => {
      const homeTeam = teamsMap.get(match.homeTeamId);
      const awayTeam = teamsMap.get(match.awayTeamId);
      const tournament = tournamentsMap.get(match.tournamentId);

      return {
        ...match,
        tournamentName: tournament?.name || 'Torneo Desconocido',
        homeTeamName: homeTeam?.name || 'Equipo Desconocido',
        homeTeamLogo: homeTeam?.logoUrl || '/logo-placeholder.png',
        awayTeamName: awayTeam?.name || 'Equipo Desconocido',
        awayTeamLogo: awayTeam?.logoUrl || '/logo-placeholder.png',
      };
    });
    
    console.log(`[DB Service] Se encontraron y enriquecieron ${enrichedMatches.length} partidos finalizados.`);
    
    // Ordenar por fecha de partido descendente (más recientes primero)
    return enrichedMatches.sort((a, b) => {
      const dateA = a.details?.date ? new Date(a.details.date).getTime() : 0;
      const dateB = b.details?.date ? new Date(b.details.date).getTime() : 0;
      return dateB - dateA;
    });

  } catch (error) {
    console.error("[DB Service] Error crítico al obtener partidos finalizados:", error);
    return [];
  }
};


/**
 * Guarda o actualiza los datos financieros de un partido específico.
 * Marca el partido como procesado financieramente en una operación atómica.
 * @param matchId El ID del partido a actualizar.
 * @param financesData Un objeto con las ganancias, gastos y notas.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const saveMatchFinances = async (matchId: string, financesData: Omit<MatchFinances, 'balance' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    console.log(`[DB Service] Guardando finanzas para el partido: ${matchId}`);
    try {
        const { earnings, expenses, notes } = financesData;
        const balance = earnings - expenses;

        const financialEntry: Omit<MatchFinances, 'createdAt'> = {
            earnings,
            expenses,
            balance,
            notes: notes || '',
            updatedAt: serverTimestamp(),
        };

        const updates: { [key: string]: any } = {};
        
        const financeRef = ref(db, `match_finances/${matchId}`);
        const existingFinanceSnap = await get(financeRef);

        if (existingFinanceSnap.exists()) {
            // Si ya existe, solo actualizamos los campos y el updatedAt
            updates[`/match_finances/${matchId}`] = financialEntry;
        } else {
            // Si es nuevo, establecemos createdAt
            updates[`/match_finances/${matchId}`] = { ...financialEntry, createdAt: serverTimestamp() };
        }
        
        // Marcamos el partido como procesado en la caja
        updates[`/matches/${matchId}/financesProcessed`] = true;

        await update(ref(db), updates);
        console.log(`[DB Service] Finanzas para el partido ${matchId} guardadas exitosamente.`);

    } catch (error) {
        console.error(`[DB Service] Error al guardar finanzas para el partido ${matchId}:`, error);
        throw new Error('No se pudieron guardar los datos financieros del partido.');
    }
};
