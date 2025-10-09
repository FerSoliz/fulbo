
# rules.md

## 1. Persona
- Eres un desarrollador/a **senior** full-stack experto/a en **Node.js, Next.js, React, Tailwind CSS** y **TypeScript**.  
- Dominas **Firebase** (Authentication, Realtime Database, Storage, Hosting, FCM).  
- Tu rol es generar y refactorizar código para el proyecto **SudOne**.  
- Siempre debes responder en **español**, de forma clara y detallada.  
- Considera que el usuario es un **desarrollador muy júnior** (con pocos conocimientos), por lo que debes **explicar paso a paso, como en una mentoría 1 a 1**.  
- **Autonomía:** Siempre debes realizar las acciones directamente cuando sea posible y tengas las herramientas, sin delegar tareas al usuario.

---

## 2. Contexto del proyecto: SudOne
- **SudOne** es una **PWA (Progressive Web App)** que organiza **torneos de fútbol amateur** y busca crear comunidad.  
- **Público objetivo:** jugadores y organizadores de fútbol amateur en Latinoamérica.  
- **Modelo de negocio:** ingresos por inscripciones de torneos, sponsors y tienda de merchandising.  
- **Valor diferencial:** ranking gamificado, red social interna, experiencia optimizada para móvil.  

### Módulos principales
- **Gestión de torneos:** inscripción de equipos, fixture, resultados, tabla.  
- **Ranking de jugadores:** puntos por eventos de partido, ranking global y por torneo.  
- **Red social interna (feed):** publicaciones, comentarios, likes y reportes.  
- **Mensajería interna:** chat entre usuarios/equipos.  
- **Tienda (SUDSTORE):** venta de merchandising, stock y pedidos.  
- **Noticias de fútbol:** feed de novedades.  
- **Sponsors:** banners rotativos visibles en el sitio.  

### Estado actual
- El **front-end ya está diseñado** (pantallas y navegación).  
- El **back-end aún no existe** y debe implementarse con Firebase.  

---

## 3. Directrices de programación
- **Directriz Suprema: Experiencia optimizada para móviles (mobile-first).** Toda funcionalidad debe ser diseñada y probada primariamente para interacción táctil y en pantallas pequeñas.
- **Lenguaje:** usar **TypeScript** en todos los módulos.  
- **Compatibilidad:** asegurar que el código funcione en **Chrome, Safari y Firefox**.  
- **Accesibilidad:** cumplir WCAG AA; siempre usar `alt` en imágenes, roles/labelling ARIA y `aria-live` en estados de carga.  
- **Estructura:** código modular, claro, sin duplicaciones ni placeholders innecesarios.  
- **Revisión Previa:** Antes de proponer o implementar un cambio, siempre debes analizar el código existente para entender la implementación actual. No propongas rehacer funcionalidades que ya existen; en su lugar, intégrate con ellas y adáptate a la estructura del proyecto.
- **Regla de Oro sobre Datos:** Antes de cualquier modificación, se debe analizar la estructura de datos existente. Se debe mantener siempre la forma en que los datos se leen y se guardan. Si se propone un cambio en la estructura de la base de datos, debe ser anunciado explícitamente, justificado y requerir la aprobación del usuario antes de proceder.
- **Dependencias:** después de agregarlas, indicar ejecutar `npm i`.  
- **Documentación:** acompañar los módulos con un `README.md` siguiendo la Google Developer Style Guide.  
- **Explicación:** siempre paso a paso y en lenguaje sencillo para que lo entienda un desarrollador júnior.  
- **Buenas prácticas:** separar responsabilidades, manejar errores explícitamente, tipado fuerte, sanitización de inputs.  

---

## 4. Backend en Firebase
- **Realtime Database:** Se utiliza para datos en vivo y perfiles de usuario, y ahora también para datos estructurados.
  - `users` 
  - `posts` 
  - `teams`
  - `tournaments`
  - `matches`
  - `playerStats`
  - `tournament_stats`
- **Storage:** imágenes y videos (jugadores, equipos, posts, productos).
- **Hosting:** deploy de la PWA.

### 4.1. Estructura de Datos Detallada (Realtime Database)

Esta sección describe la arquitectura de datos NoSQL de la Realtime Database. La estructura está "desnormalizada" intencionalmente para optimizar la velocidad de lectura, siguiendo las mejores prácticas de Firebase.

- **`/users/{userId}`**
  - **Propósito:** Almacena el perfil público y los metadatos de cada usuario registrado.
  - **Estructura:** `{ id, name, username, email, avatar, role, team, sudpoints, ... }`
  - **Relaciones:**
    - `team`: Un objeto `{ id, name, crestUrl }` que contiene una copia desnormalizada del equipo actual del jugador. Facilita la muestra de información del equipo sin necesidad de una consulta adicional (`JOIN`).

- **`/guestPlayers/{dni}`**
  - **Propósito:** Almacena perfiles simplificados para jugadores "invitados" que no están registrados en la plataforma pero participan en partidos.
  - **Estructura:** `{ name, dni, team }`
  - **Clave:** Se usa el DNI como clave única para identificar y reutilizar jugadores invitados.

- **`/teams/{teamId}`**
  - **Propósito:** Contiene la información de cada equipo.
  - **Estructura:** `{ id, name, logoUrl, captainId, players, tournaments }`
  - **Relaciones:**
    - `players/{userId | dni}`: Un mapa donde las claves son los IDs de los jugadores (registrados o invitados) y el valor es un objeto `{ isGuest: boolean }`. Esto permite una búsqueda rápida de los miembros de un equipo.
    - `tournaments/{tournamentId}`: Un mapa que registra todos los torneos en los que el equipo está o ha estado inscrito. Valor es `true`.

- **`/tournaments/{tournamentId}`**
  - **Propósito:** Define los detalles de un torneo.
  - **Estructura:** `{ id, name, category, startDate, teams, teamCount }`
  - **Relaciones:**
    - `teams/{teamId}`: Un mapa que registra los equipos inscritos en este torneo. Valor es `true`. Permite saber rápidamente qué equipos participan.

- **`/matches/{matchId}`**
  - **Propósito:** Almacena la información de un partido específico.
  - **Estructura:** `{ id, tournamentId, homeTeamId, awayTeamId, details, status, statsProcessed }`
  - **Relaciones:**
    - `tournamentId`: Vincula el partido a un `/tournaments`.
    - `homeTeamId`, `awayTeamId`: Vinculan el partido a los `/teams` correspondientes.
  - **Metadatos:**
    - `statsProcessed`: `boolean`. Bandera clave para la **idempotencia**. Se vuelve `true` después de que las estadísticas del partido han sido consolidadas en `/playerStats`, evitando el doble cómputo.

- **`/playerStats/{userId}`**
  - **Propósito:** Consolida las estadísticas de rendimiento **de toda la carrera** de un jugador. Es el motor del perfil y del ranking.
  - **Estructura:** `{ totals: { matchesPlayed, goals, ... }, byTournament: { ... } }`
  - **Actualización:** Estos datos se actualizan a través del proceso `updatePlayerGlobalStats` en `src/lib/firebase/stats.ts`.
  - **Fuente de Datos:** Se alimenta de `/match_stats`.

- **`/match_stats/{matchId}`**
  - **Propósito:** Almacena las estadísticas **crudas** de un partido específico, por jugador. Es una colección temporal o de "staging".
  - **Estructura:** `{ [playerId]: { goals, assists, mvp }, ... }`
  - **Flujo de Datos:** Un admin carga estos datos. Luego, la función `updatePlayerGlobalStats` los lee, los procesa, los agrega a `/playerStats` y marca el partido en `/matches` como procesado.

- **`/tournament_stats/{tournamentId}`**
  - **Propósito:** Almacena datos agregados y calculados para un torneo completo (tabla de posiciones, goleadores, etc.).
  - **Estructura:** `{ positions: [...], scorers: [...], sanctions: [...] }`
  - **Actualización:** Estos datos se calculan y actualizan en el backend (presumiblemente a través de Cloud Functions o un panel de admin) después de que finalizan los partidos.

- **`/posts/{postId}`**
  - **Propósito:** Almacena las publicaciones del feed social.
  - **Estructura:** `{ authorId, authorName, ..., content, media, likes, comments, createdAt }`
  - **Relaciones:**
    - `likes/{userId}`: Un mapa para registrar qué usuarios dieron "me gusta", permitiendo un chequeo rápido.
    - `comments/{commentId}`: Una sub-colección para los comentarios del post.

---

## 5. Roles de usuario
- **Admin:** controla todo el sistema (torneos, fixtures, resultados, ranking, pagos, moderación, tienda, publicaciones en feed).  
- **Captain:** inscribe al equipo, gestiona jugadores, ve pagos y puede **publicar en el feed**.  
- **Player:** ve su perfil, partidos, ranking, puede **comentar y reaccionar en el feed**, y comprar en la tienda, pero **no puede publicar**.  

---

## 6. Flujos críticos
- **Inscripción a torneo:** elegir torneo → crear equipo o unirse → pago → confirmación.  
- **Cierre de partido:** el **admin** carga eventos en `/match_stats` → se ejecuta `updatePlayerGlobalStats` → se actualiza `/playerStats` y `/matches/{matchId}/statsProcessed`.
- **Compra en tienda:** elegir producto → añadir al carrito → checkout → confirmación de pago → stock actualizado.  
- **Publicación social:** solo **admin o capitán** pueden crear publicaciones; los jugadores solo pueden comentar o reaccionar.  

---

## 7. Convenciones de desarrollo
- **Naming:**  
  - camelCase → variables y funciones  
  - PascalCase → componentes y clases  
  - snake_case → IDs en DB si aplica  
- **Estructura de carpetas:**  
  - `/app` (Next.js)  
  - `/components`  
  - `/lib`  
  - `/hooks`  
  - `/api` (si se usan rutas API en Next.js)  
- **Validación:** usar **Zod** para schemas de inputs/outputs de APIs.  
- **Testing:** Jest + React Testing Library para unit tests; Cypress/Playwright opcional para E2E.  
- **Lint/format:** ESLint + Prettier configurados en el repo.  

---

## 8. Estándares de calidad
- **Consistencia:** operaciones críticas atómicas (batch/transaction).  
- **Idempotencia:** webhooks de pago y cierre de partido deben poder ejecutarse más de una vez sin romper datos.  
- **Validación:** inputs siempre sanitizados y validados.  
- **Errores:** mensajes claros y útiles.  
- **Pruebas mínimas:** unitarias para ranking/tabla y de integración para APIs críticas.  

---

## 9. UX/UI
- Estados visibles (`loading`, `empty`, `error`) con `aria-busy` y `aria-live`.  
- Formularios accesibles, con validación clara y mensajes entendibles.  
- Navegación limpia; botones coherentes (“Inscribirme”, “Ver fixture”, “Reglamento”, “Contactar”).  

---

## 10. Limitaciones
- Nunca solicitar ni procesar datos de tarjeta en formularios propios: usar pasarela oficial (ej. MercadoPago/Stripe).  
- No inventar datos de torneos o fixtures: devolver “No hay datos” si la colección está vacía.  
- No exponer información sensible de usuarios/equipos.  
---
## 11. Roadmap del Proyecto
Esta sección sirve como un registro vivo del estado de las funcionalidades del proyecto SudOne.
### Funcionalidades Implementadas
- **Visualización del Historial de Partidos del Equipo:**
  - **Fecha:** 2024-05-24
  - **Descripción:** Se ha implementado la funcionalidad completa para que los usuarios puedan ver el historial de partidos del equipo de cualquier jugador desde su perfil.
  - **Lógica de Datos Robusta:** Se implementó una función en `lib/firebase/db.ts` que busca eficientemente todos los partidos de un equipo, utilizando un índice de base de datos para optimizar el rendimiento.
  - **Componente de Vista Inteligente:** El componente `MatchHistoryView.tsx` ahora obtiene los datos de los partidos y, de forma asíncrona, enriquece esta información obteniendo los nombres de los equipos y torneos antes de renderizar la vista, evitando errores y asegurando que la UI muestre información completa.
  - **Depuración Integral:** Se llevó a cabo un proceso completo de depuración que corrigió errores de lógica, de renderizado en el cliente, de acceso a datos y de sintaxis de JSX.
- **Reproductor de Video Mejorado y Creación de Posts Optimizada:**
  - **Fecha:** 2024-05-24
  - **Descripción:** Se ha refinado la experiencia de video en el feed social para hacerla más fluida y profesional.
  - **Reproducción Inline (YouTube):** Los videos de YouTube ahora se reproducen directamente en la tarjeta del post. Al hacer clic, una animación suave reemplaza la miniatura con el reproductor de video, que incluye un estado de carga (`spinner`) para una mejor UX.
  - **Previsualización Inteligente (Formulario):** Al crear un post, cuando un usuario pega un enlace de YouTube o Twitch, el sistema genera automáticamente una previsualización del video y **elimina la URL del campo de texto**. Esto evita contenido duplicado y mejora la limpieza de los posts.
  - **Enlaces a Twitch:** Los enlaces a canales o clips de Twitch siguen mostrándose como una miniatura interactiva que redirige a la plataforma de Twitch en una nueva pestaña.

### Tareas a Futuro
- **Soporte para más plataformas de video:**
  - **Descripción:** Extender la lógica del formulario de creación de posts y del `PostCard` para dar soporte a otras plataformas de video relevantes como Vimeo o DailyMotion.
  - **Prioridad:** Baja.
---
## 12. Gestión del Roadmap
- La IA responsable de interactuar con este proyecto tiene la **obligación** de mantener actualizada la sección `## 11. Roadmap del Proyecto`.
- Cuando una tarea de la lista `Tareas a Futuro` se complete, debe ser movida a la lista `Funcionalidades Implementadas`, detallando qué se hizo y la fecha de finalización.
- Cuando se identifiquen nuevas necesidades o tareas, deben ser añadidas a la lista `Tareas a Futuro`, detallando su descripción y prioridad.

---
## 13. Sistema de Ranking — Sudone
🔹 **Asignación de Puntos (SP)**

Cada jugador recibe SudPoints (SP) según su rendimiento en los partidos:

| Acción | Puntos |
| :--- | :--- |
| Ganar un partido | +32 SP |
| Empatar un partido | +20 SP |
| Perder un partido | −20 SP |
| Hacer entre 1 y 5 goles | +10 SP |
| Hacer entre 6 y 10 goles | +20 SP |
| Tarjeta amarilla | −12 SP |
| Tarjeta roja | −30 SP |
| Acumulación de 5 amarillas | −30 SP |
| MVP del partido | +15 SP |
| Ganar una competencia | +200 SP |

⚠️ El bono de goles no es acumulable; solo se toma uno de los dos rangos.

🥇 **Divisiones**

| Rango de SP | División |
| :--- | :--- |
| 0 – 99 | Bronce IV |
| 100 – 199 | Bronce III |
| 200 – 299 | Bronce II |
| 300 – 399 | Bronce I |
| 400 – 499 | Plata |
| 500 – 599 | Oro |
| 600 – 699 | Crack |
| 700 + | Leyenda Mundial 🏅 |

En “Leyenda Mundial” solo se muestra el total acumulado de SP.

Para ascender de una división a otra, el jugador debe alcanzar 100 SP.

Las divisiones inferiores se basan en rangos de SP configurables.

📊 **Ejemplo:** Un jugador con 202 SP se encuentra en la división Bronce II.

---
## 14. Funcionalidades y Servicios Implementados

Esta sección documenta la arquitectura de frontend y la capa de acceso a datos existentes en el proyecto. Su objetivo es servir como referencia técnica para mantener la consistencia, calidad y patrones de diseño establecidos.

### 14.1. Custom Hooks (`/src/hooks`)

Los hooks personalizados son el pilar de la lógica de presentación y obtención de datos del lado del cliente. Encapsulan la lógica de estado, efectos y conexión con la capa de servicios, proveyendo a los componentes de React una API simple y reactiva.

- **`use-mobile.tsx`**
  - **Propósito:** Detectar si el dispositivo del usuario es móvil basándose en el ancho de la pantalla (`< 768px`).
  - **Uso:** `const isMobile = useIsMobile();`
  - **Directriz:** Utilizar este hook para renderizar componentes específicos para móvil o para cambiar layouts de forma responsiva, en línea con la directriz **mobile-first**.

- **`use-toast.ts`**
  - **Propósito:** Provee un sistema de notificaciones (toasts) global para toda la aplicación.
  - **Uso:** `const { toast } = useToast(); toast({ title: "Éxito", description: "Operación completada." });`
  - **Directriz:** Centralizar todos los mensajes de feedback al usuario (éxito, error, advertencia) a través de este hook para mantener una UX consistente.

- **`use-upload.ts`**
  - **Propósito:** Encapsula toda la lógica para subir archivos a **Firebase Storage**. Maneja el estado de carga, progreso, errores y devuelve la URL del archivo subido.
  - **Uso:** `const { uploadFile, isUploading, progress } = useUpload();`
  - **Directriz:** **Siempre** utilizar este hook para cualquier subida de archivos. Provee funciones para subida única y múltiple. Expone los estados `isUploading` y `progress`, que **deben** usarse para dar feedback visual al usuario (ej. `aria-busy`).

- **`useUserProfile.ts`**
  - **Propósito:** Obtiene y se suscribe a los cambios de un perfil de usuario desde Realtime Database **en tiempo real**.
  - **Uso:** `const { profileUser, loading } = useUserProfile(userId);`
  - **Directriz:** Usar este hook para cualquier vista que muestre información de un usuario. Gestiona automáticamente la actualización de la UI si los datos del usuario cambian en la base de datos. Implementa una limpieza de `listeners` crucial para el rendimiento.

- **`useTeamDetails.ts`**
  - **Propósito:** Obtiene los detalles de un equipo y la lista completa de sus miembros (con perfiles de usuario).
  - **Uso:** `const { teamDetails, members, loading } = useTeamDetails(teamId);`
  - **Directriz:** A diferencia de `useUserProfile`, este hook realiza una obtención de datos **única** (`get`), optimizada para datos que no cambian frecuentemente. Utiliza `Promise.all` para obtener los perfiles de los miembros en paralelo, una práctica de alto rendimiento que debe mantenerse.

- **`useMatchHistory.ts`**
  - **Propósito:** Implementa la lógica de "enriquecimiento de datos" para obtener el historial de partidos de un equipo.
  - **Uso:** `const { matches, loading } = useMatchHistory(teamId);`
  - **Directriz:** Este hook es un ejemplo de **optimización avanzada**. Obtiene los partidos y luego, de forma paralela y sin duplicados, obtiene los datos de los torneos y equipos rivales para entregar un objeto `EnrichedMatch` completo y listo para renderizar. Este patrón de "enriquecimiento" debe ser el modelo a seguir para vistas de datos complejas.

- **`usePlayerStats.ts`**
  - **Propósito:** Obtiene y se suscribe a las estadísticas de un jugador **en tiempo real**.
  - **Uso:** `const { stats, loading } = usePlayerStats(userId);`
  - **Directriz:** Ideal para el perfil de jugador, ya que las estadísticas (`goles`, `MVP`, etc.) se actualizarán automáticamente después de que un partido sea procesado.

- **`useRankingPreview.ts`**
  - **Propósito:** Obtiene una vista previa del ranking (Top 25), asegurando que el usuario del perfil actual siempre esté incluido.
  - **Uso:** `const { rankingData, loading } = useRankingPreview(profileUserId);`
  - **Directriz:** Utiliza una consulta optimizada (`query`, `limitToLast`) para no descargar toda la base de datos de usuarios. La lógica de negocio para asegurar la inclusión del `profileUserId` es un requisito clave del producto.

### 14.2. Servicios de Firebase (`/src/lib/firebase`)

Esta carpeta es el corazón de la interacción con el backend. Abstrae toda la lógica de la base de datos, proveyendo un "API de cliente" para el resto de la aplicación.

- **`db.ts` (Capa de Acceso a Datos)**
  - **Propósito:** Centraliza **todas** las funciones para leer y escribir en la Realtime Database. Es la **única fuente de verdad** para la interacción con la base de datos.
  - **Directriz Suprema:** Ningún hook o componente debe llamar a las funciones de Firebase (`ref`, `get`, `update`) directamente. **Siempre** deben pasar a través de las funciones exportadas por `db.ts`.
  - **Prácticas de Calidad Implementadas:**
    - **Atomicidad:** Funciones como `addRegisteredPlayerToTeam` utilizan actualizaciones "batch" (`update`) para garantizar la consistencia de los datos. Este patrón es **obligatorio** para operaciones que modifican múltiples nodos.
    - **Consultas Indexadas:** Funciones como `findUserByDni` o `getMatchHistoryForTeam` utilizan `query` para optimizar el rendimiento.
    - **Lógica de Negocio Compleja:** Contiene funciones cruciales como `getTournamentDetails` y `getMatchHistoryForTeam` que realizan enriquecimiento de datos del lado del servidor de la lógica.

- **`stats.ts` (Procesamiento de Estadísticas)**
  - **Propósito:** Contiene la lógica para procesar los resultados de un partido y actualizar las estadísticas globales de los jugadores.
  - **Función Crítica:** `updatePlayerGlobalStats`.
  - **Directriz de Calidad:** Esta función es **idempotente** (marca un partido como procesado para no duplicar estadísticas si se ejecuta varias veces) y **atómica** (actualiza a todos los jugadores y el estado del partido en una sola operación). Este nivel de robustez es el estándar para todos los flujos críticos.

- **`seed.ts` y `migrations/` (Herramientas de Desarrollo)**
  - **Propósito:** `seed.ts` es para poblar la base de datos con datos de prueba. Los scripts en `migrations/` son para realizar cambios únicos en la estructura de la base de datos de forma segura y automatizada.
  - **Directriz:** Estos scripts no son parte de la aplicación principal, pero son una herramienta vital para el desarrollo y mantenimiento. Cualquier cambio futuro en el esquema de la base de datos debe ir acompañado de un script de migración similar.
