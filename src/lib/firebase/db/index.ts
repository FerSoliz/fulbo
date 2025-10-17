/**
 * @fileoverview Este es el "barrel" de la capa de acceso a datos.
 * Re-exporta todas las funciones de los módulos de base de datos para que puedan ser importadas
 * desde una única ubicación, manteniendo la modularidad interna.
 */

export * from './users';
export * from './guestPlayers';
export * from './teams';
export * from './tournaments';
export * from './matches';
export * from './posts';
export * from './products';
export * from './cashEntries';
export * from './stats';
