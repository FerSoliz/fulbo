// Carga las variables de entorno ANTES que cualquier otro código
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

import { ref, get, update } from 'firebase/database';
import { db } from '../../firebase';

/**
 * Script de migración único para convertir equipos a la estructura de multi-torneo.
 */
async function migrateTeamsData() {
  console.log('Iniciando migración de datos de equipos...');
  
  try {
    const teamsRef = ref(db, 'teams');
    const snapshot = await get(teamsRef);

    if (!snapshot.exists()) {
      console.log('No se encontraron equipos. No hay nada que migrar.');
      process.exit(0);
      return;
    }

    const allTeams = snapshot.val();
    const updates: { [key: string]: any } = {};
    let teamsToMigrateCount = 0;

    for (const teamId in allTeams) {
      const team = allTeams[teamId];

      if (team.tournamentId && !team.tournaments) {
        console.log(`- Equipo encontrado para migrar: ${team.name || teamId}`);
        
        const oldTournamentId = team.tournamentId;
        
        updates[`/teams/${teamId}/tournaments/${oldTournamentId}`] = true;
        updates[`/teams/${teamId}/tournamentId`] = null;

        teamsToMigrateCount++;
      }
    }

    if (teamsToMigrateCount > 0) {
      console.log(`\nSe migrarán ${teamsToMigrateCount} equipos. Aplicando actualizaciones...`);
      await update(ref(db), updates);
      console.log('¡Migración completada con éxito!');
    } else {
      console.log('Todos los equipos ya están en el formato nuevo. No se requiere migración.');
    }

  } catch (error) {
    console.error('Ocurrió un error durante la migración:', error);
  } finally {
    process.exit(0);
  }
}

migrateTeamsData();
