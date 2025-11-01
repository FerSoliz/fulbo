
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

Esta sección describe la arquitectura de datos NoSQL de la Realtime Database. La estructura está "desnormalizada" intencionadamente para optimizar la velocidad de lectura, siguiendo las mejores prácticas de Firebase.

- **`/users/{userId}`**
  - **Propósito:** Almacena el perfil público y los metatos de cada usuario registrado. Es la fuente de verdad para un jugador registrado.
  - **Estructura:** `{ id, name, username, email, dni, role, avatar, profileBackground, team, sudpoints, ... }`
  - **Relaciones:**
    - `team`: Un objeto `{ id, name, crestUrl }` que contiene una copia desnormalizada del equipo actual del jugador. Facilita la muestra de información del equipo sin necesidad de una consulta adicional (`JOIN`). Puede ser `null`.

- **`/guestPlayers/{dni}`**
  - **Propósito:** Almacena perfiles simplificados para jugadores "invitados" que no están registrados pero participan en partidos. Sirve como un perfil temporal hasta que el jugador se registra.
  - **Estructura:** `{ name, dni, team, sudpoints }`
  - **Clave:** Se usa el DNI como clave única.
  - **Flujo de Datos:** Cuando un invitado se registra, los datos de este nodo (incluyendo `team` y `sudpoints`) **se migran** a un nuevo perfil en `/users/{userId}` y este nodo de invitado se elimina.
  - **Relaciones:**
    - `team`: Un objeto `{ id, name, crestUrl }` con la información del equipo al que fue añadido.
  - **Estadísticas:**
    - `sudpoints`: Acumula los SudPoints ganados en partidos mientras el jugador es invitado.

- **`/teams/{teamId}`**
  - **Propósito:** Contiene la información de cada equipo.
  - **Estructura:** `{ id, name, logoUrl, captainId, players, tournaments }`
  - **Relaciones:**
    - `players/{userId | dni}`: Un mapa donde las claves son los IDs de los jugadores (registrados o invitados) y el valor es un objeto `{ isGuest: boolean }`.
    - `tournaments/{tournamentId}`: Un mapa que registra todos los torneos en los que el equipo está inscrito.

- **`/tournaments/{tournamentId}`**
  - **Propósito:** Define los detalles de un torneo.
  - **Estructura:** `{ id, name, category, startDate, teams, teamCount }`
  - **Relaciones:**
    - `teams/{teamId}`: Un mapa que registra los equipos inscritos.

- **`/matches/{matchId}`**
  - **Propósito:** Almacena la información de un partido.
  - **Estructura:** `{ id, tournamentId, homeTeamId, awayTeamId, details, status, statsProcessed }`
  - **Metadatos:**
    - `statsProcessed`: `boolean`. Bandera clave para la **idempotencia**. Se vuelve `true` después de que las estadísticas del partido han sido consolidadas, evitando el doble cómputo.

- **`/playerStats/{userId}`**
  - **Propósito:** Consolida las estadísticas de rendimiento detalladas (goles, MVP, etc.) de un jugador **registrado**.
  - **Estructura:** `{ totals: { ... }, byTournament: { ... } }`
  - **Nota:** Actualmente, este nodo solo aplica a usuarios registrados. No existe un `/guestPlayerStats`.

- **`/match_stats/{matchId}`**
  - **Propósito:** Almacena las estadísticas **crudas** de un partido específico, por jugador (registrado o invitado).
  - **Estructura:** `{ [playerId]: { goals, assists, mvp, sudPointsChange }, ... }`
  - **Flujo de Datos:** Un admin carga estos datos. La función `updatePlayerGlobalStats` los lee, los procesa, los agrega a `/playerStats` (para usuarios) y actualiza los `sudpoints` en `/users` o `/guestPlayers`.

- **`/tournament_stats/{tournamentId}`**
  - **Propósito:** Almacena datos agregados para un torneo (tabla de posiciones, goleadores, etc.).
  - **Estructura:** `{ positions: [...], scorers: [...], sanctions: [...] }`

- **`/posts/{postId}`**
  - **Propósito:** Almacena las publicaciones del feed social.
  - **Estructura:** `{ authorId, ..., content, media, likes, comments, createdAt }`

---

## 5. Roles de usuario
- **Admin:** controla todo el sistema (torneos, fixtures, resultados, ranking, pagos, moderación, tienda, publicaciones en feed).  
- **Captain:** inscribe al equipo, gestiona jugadores, ve pagos y puede **publicar en el feed**.  
- **Player:** ve su perfil, partidos, ranking, puede **comentar y reaccionar en el feed**, y comprar en la tienda, pero **no puede publicar**.  

---

## 6. Flujos críticos
- **Inscripción a torneo:** elegir torneo → crear equipo o unirse → pago → confirmación.  
- **Cierre de partido:** el **admin** carga eventos en `/match_stats` → se ejecuta `updatePlayerGlobalStats` → se actualiza `/playerStats`, los `sudpoints` y se marca el partido como procesado.
- **Registro de Jugador Invitado:** El usuario introduce su DNI en el registro → el sistema busca en `/guestPlayers/{dni}` → si lo encuentra, precarga su nombre → el usuario completa el formulario → el sistema crea una cuenta en Firebase Auth → crea un perfil en `/users/{uid}` migrando `name`, `team` y `sudpoints` del invitado → elimina el registro de `/guestPlayers/{dni}` en una operación atómica.
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
- **Tipos Centralizados:** Todas las interfaces y tipos de datos globales deben definirse en **`src/lib/types.ts`** como única fuente de verdad para evitar inconsistencias.

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
- **Centralización de la Lógica de Sobres de Cartas:**
  - **Fecha:** 2024-05-27
  - **Descripción:** Se ha refactorizado y centralizado toda la lógica relacionada con la gestión de sobres de cartas coleccionables en el contexto de usuario (`src/context/user-context.tsx`) para resolver un error `TypeError` y mejorar la robustez del sistema.
  - **Corrección de Error:** Se solucionó el error `TypeError: trackPackOpening is not a function` que ocurría al intentar abrir un sobre. El error se debía a que la función era llamada en la página de coleccionables pero su lógica no estaba implementada ni provista por el `useUser` hook.
  - **Gestión de Estado Centralizada:** Toda la gestión del estado de los sobres (la cantidad de sobres disponibles `availablePacks`, el temporizador para el siguiente sobre `nextPackTimestamp` y la cuenta regresiva `countdown`) se movió desde la página `collectibles/page.tsx` al `UserProvider`.
  - **Sincronización con Base de Datos:** El contexto ahora se encarga de leer el estado de los sobres desde la Realtime Database al iniciar sesión y de guardarlo de forma atómica cada vez que un usuario abre un sobre, usando la función `trackPackOpening`.
  - **Código Simplificado:** Como resultado, el código de la página `collectibles/page.tsx` se ha simplificado significativamente, eliminando la lógica de estado redundante y delegando toda la responsabilidad al `user-context`.
- **Refactorización de Módulo de Coleccionables y Migración a Realtime Database:**
  - **Fecha:** 2024-05-27
  - **Descripción:** Se ha refactorizado por completo la página de coleccionables (`/collectibles`) para mejorar su estructura y se ha migrado toda la lógica de persistencia de datos de Firestore a Realtime Database.
  - **Modularización de Componentes:** La página se dividió en componentes más pequeños y reutilizables (`MainMenu`, `PackOpeningView`, `TeamFormationView`), cada uno con su propia responsabilidad, mejorando la legibilidad y mantenibilidad del código.
  - **Eliminación de Firestore:** Se han removido por completo las importaciones y las llamadas a la base de datos Firestore (`doc`, `getDoc`, `setDoc`). La página ya no tiene ninguna conexión con este servicio.
  - **Integración de la Nueva Capa de Datos:** Se importaron y utilizaron las nuevas funciones `getUserCollectibles`, `saveUserCardCollection` y `saveUserTeamFormation` del módulo centralizado `lib/firebase/db/collectibles.ts`.
  - **Refactorización del Flujo de Datos:**
    - **Lectura (`useEffect`):** Al cargar la página, ahora se utiliza `getUserCollectibles(user.id)` para obtener toda la información del juego (colección y equipo) en una sola llamada a Realtime Database, lo cual es más eficiente.
    - **Escritura (`onSave`):** Las funciones de guardado ahora delegan la responsabilidad a `saveUserCardCollection` y `saveUserTeamFormation`, centralizando la lógica de base de datos y manteniendo el componente principal limpio.
- **Optimización Responsiva de la Vista de Torneos:**
  - **Fecha:** 2024-05-26
  - **Descripción:** Se ha llevado a cabo una refactorización detallada de la página de torneos para mejorar significativamente su visualización en dispositivos móviles, siguiendo un proceso iterativo de ajustes finos.
  - **Ajuste de Título:** Se redujo la altura de la tarjeta de título para compactar la cabecera en móviles, usando un diseño responsivo que mantiene la altura original en escritorio.
  - **Optimización de Espaciado:** Se redujeron los márgenes (`padding`) de la página y el espacio (`gap`) entre las tarjetas de torneos en la vista móvil. Esto permite que las tarjetas sean más anchas y aprovechen mejor el espacio disponible en pantalla.
  - **Refinamiento de Texto:** Se unificó el estilo del texto en las tarjetas, convirtiéndelo a mayúsculas y ajustando el espaciado entre los datos (día y sede) para una presentación más limpia y profesional.
- **Mejora de la Visualización de Torneos y Limpieza de Rutas:**
  - **Fecha:** 2024-05-25
  - **Descripción:** Se realizó una refactorización integral de la visualización de torneos y se eliminó código obsoleto para mejorar la mantenibilidad del proyecto.
  - **Centralización de Tipos:** Se definió una interfaz `FullTournament` en `src/lib/types.ts` para crear una única fuente de verdad para la estructura de datos de los torneos, incluyendo campos clave como `name`, `venue` (sede) y `status`.
  - **Componente de Torneo Mejorado:** Se rediseñó el `TournamentCard` en la página `/tournaments` para mostrar la información esencial de manera clara y atractiva. Se mejoró la UX con estados de carga (`skeleton loaders`) y mensajes de error más informativos.
  - **Eliminación de Código Muerto:** Se eliminó la página obsoleta y sin uso `/leagues`, que contenía un error de sintaxis y causaba fallos de compilación. Esto simplifica la estructura de rutas y limpia el proyecto.
- **Motor de Ranking y SudPoints (SP) Integrado:**
  - **Fecha:** 2024-05-24
  - **Descripción:** Se implementó el motor de cálculo y asignación de SudPoints, el núcleo del sistema de ranking de SudOne.
  - **Lógica Atómica y Segura:** La función `updatePlayerGlobalStats` ahora calcula los SP de cada jugador tras un partido y actualiza su perfil (`/users/{uid}/sudpoints`) de forma atómica. También guarda un registro (`sudPointsChange`) en las estadísticas del partido para permitir reversiones seguras.
  - **Función de Reversión Robusta:** La función `revertMatchStats` utiliza el registro `sudPointsChange` para revertir los puntos de forma precisa cuando un administrador necesita corregir un partido, garantizando la integridad del ranking. El sistema está diseñado para ser idempotente, evitando duplicidad de operaciones.
  - **Refactorización de Código:** Se refactorizó el archivo `lib/firebase/stats.ts`, eliminando la lógica de recálculo compleja anterior y sustituyéndola por un sistema de transacciones (suma/resta) más simple, eficiente y directo.
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

### Funcionalidades Deshabilitadas Temporalmente
- **Deshabilitación de Mensajería y Notificaciones:**
  - **Fecha:** 2024-05-27
  - **Descripción:** Se ha decidido posponer el desarrollo de las funcionalidades de mensajería interna y notificaciones para priorizar el desarrollo de los módulos centrales del proyecto (torneos, ranking, perfiles).
  - **Cambios Realizados:**
    - Se ocultó el enlace "MENSAJES" del menú de navegación lateral (`src/components/main-sidebar.tsx`).
    - Se ocultó el ícono de notificaciones y su menú desplegable en la cabecera principal (`src/components/page-header.tsx`).
  - **Próximos Pasos:** Estas funcionalidades se reactivarán y desarrollarán en una futura fase del proyecto, cuando las características principales estén consolidadas.

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

### 14.1. Gestión de Estado del Usuario (`/src/context/user-context.tsx`)

- **Propósito:** Es el componente central para la gestión del estado de autenticación y los datos del perfil del usuario en toda la aplicación.
- **Componente:** `UserProvider`. Debe envolver la aplicación para que el contexto esté disponible.
- **Hook:** `useUser()`. Provee acceso al objeto `user` y a las funciones de `login`, `logout` y `register`.
- **Flujo de `register`:**
  1.  Llama a `createUserWithEmailAndPassword` de Firebase Auth.
  2.  Verifica si existe un perfil en `/guestPlayers` usando el DNI.
  3.  Construye un nuevo objeto `User` migrando los datos del invitado (`team`, `sudpoints`) si existen.
  4.  Realiza una escritura atómica que crea el perfil en `/users/{uid}` y elimina el perfil de `/guestPlayers/{dni}`.

### 14.2. Custom Hooks (`/src/hooks`)

- **`use-mobile.tsx`**
  - **Propósito:** Detectar si el dispositivo del usuario es móvil basándose en el ancho de la pantalla (`< 768px`).
- **`use-toast.ts`**
  - **Propósito:** Provee un sistema de notificaciones (toasts) global para toda la aplicación.
- **`use-upload.ts`**
  - **Propósito:** Encapsula toda la lógica para subir archivos a **Firebase Storage**. Maneja el estado de carga, progreso, errores y devuelve la URL del archivo subido.
- **`useUserProfile.ts`**
  - **Propósito:** Obtiene y se suscribe a los cambios de un perfil de usuario desde Realtime Database **en tiempo real**.
- **`useTeamDetails.ts`**
  - **Propósito:** Obtiene los detalles de un equipo y la lista completa de sus miembros (con perfiles de usuario).
- **`useMatchHistory.ts`**
  - **Propósito:** Implementa la lógica de "enriquecimiento de datos" para obtener el historial de partidos de un equipo.
- **`usePlayerStats.ts`**
  - **Propósito:** Obtiene y se suscribe a las estadísticas de un jugador **en tiempo real**.
- **`useRankingPreview.ts`**
  - **Propósito:** Obtiene una vista previa del ranking (Top 25), asegurando que el usuario del perfil actual siempre esté incluido.

### 14.3. Servicios de Firebase (`/src/lib/firebase`)

- **`db.ts` (Capa de Acceso a Datos)**
  - **Propósito:** Centraliza **todas** las funciones para leer y escribir en la Realtime Database. Es la **única fuente de verdad** para la interacción con la base de datos.
  - **Directriz Suprema:** Ningún hook o componente debe llamar a las funciones de Firebase (`ref`, `get`, `update`) directamente. **Siempre** deben pasar a través de las funciones exportadas por `db.ts`.
- **`stats.ts` (Procesamiento de Estadísticas)**
  - **Propósito:** Contiene la lógica para procesar los resultados de un partido y actualizar las estadísticas globales de los jugadores.
  - **Función Crítica:** `updatePlayerGlobalStats`.
  - **Lógica Actualizada:** La función ahora es más robusta. Antes de actualizar, determina si un `playerId` corresponde a un usuario (`/users/{uid}`) o a un invitado (`/guestPlayers/{dni}`). Esto le permite **actualizar los `sudpoints` para ambos tipos de jugadores**, asegurando que los invitados también acumulen puntos que luego podrán ser migrados al registrarse.
- **`seed.ts` y `migrations/` (Herramientas de Desarrollo)**
  - **Propósito:** `seed.ts` es para poblar la base de datos con datos de prueba. Los scripts en `migrations/` son para realizar cambios únicos en la estructura de la base de datos de forma segura y automatizada.

---
## 15. Guía de Estilos de Interfaz y Paleta de Colores

Esta sección define la paleta de colores oficial para la interfaz de SudOne. El objetivo es asegurar una experiencia visual consistente en toda la aplicación.

### 15.1. Configuración para Tailwind CSS

Se recomienda agregar estos colores al archivo `tailwind.config.js` para facilitar su uso en todo el proyecto. Al asignarles un nombre de "token", podemos cambiar un color en un solo lugar y se actualizará en toda la aplicación.

| Nombre Token | Valor Hex | Uso Sugerido |
| :--- | :--- | :--- |
| `primary` | `#21232f` | Fondos principales, menús oscuros |
| `secondary` | `#2e303f` | Fondos secundarios, barras, menús laterales, relleno de inputs |
| `container` | `#292e38` | Contenedores de contenido, tarjetas, botones |
| `border-soft` | `#343b46` | Bordes y líneas divisorias |
| `border-hard` | `#222222` | Bordes sutiles y finos |
| `accent-blue` | `#2490e3` | Elementos de acento, líneas destacadas |
| `accent-red` | `#fe0141` | Indicadores de selección, acentos importantes |

### 15.2. Aplicación por Componente

#### **Feed**

| Elemento | Descripción | Color (Token) | Valor Hex |
| :--- | :--- | :--- | :--- |
| Contenedor del Buscador | Fondo del área que contiene el buscador en la sidebar. | `primary` | `#21232f` |
| Relleno del Buscador | Fondo del campo de input del buscador. | `secondary` | `#2e303f` |
| Contorno del Buscador | Borde del campo de input del buscador. | `border-soft` | `#343b46` |
| Contenedores Generales | Fondo de las tarjetas o secciones principales del feed. | `container` | `#292e38` |
| Líneas de Borde | Bordes superior e inferior que enmarcan contenedores. | `container` | `#292f38` |
| Línea Inicio Comentarios | Línea vertical que marca el comienzo de los comentarios. | `accent-blue` | `#2490e3` |
| Línea Divisora Comentarios | Separador entre comentarios individuales. | `border-soft` | `#343b46` |
| Navegación Móvil | Fondo de la barra de navegación inferior en móviles. | `secondary` | `#2e303f` |

#### **Perfil de Usuario**

| Elemento | Descripción | Color (Token) | Valor Hex |
| :--- | :--- | :--- | :--- |
| Contenedor y Botones | Fondo para las secciones de contenido y botones. | `container` | `#292f38` |
| Iconos de Botones | Color para los íconos dentro de los botones. | `container` | `#292f38` |
| Marco Fino del Contenedor | Borde exterior de los contenedores principales. | `border-hard` | `#222222` |
| Menús Laterales | Fondo de los menús de navegación secundarios en el perfil. | `secondary` | `#2e303f` |
| Menú Central | Fondo del área de contenido principal o menú central. | `primary` | `#21232f` |
| Texto Menú Activo | Color del texto para el ítem de menú que está seleccionado. | `primary` | `#21232f` |
| Indicador Menú Activo | Línea inferior que resalta el ítem de menú seleccionado. | `accent-red` | `#fe0141` |
