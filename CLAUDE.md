# FlowSync — contexto para Claude Code

Gestión de tareas en equipo. Monorepo de dos aplicaciones: una API en `backend/` y un
cliente web en `frontend/`. Es un proyecto de práctica del curso AI4Devs, sobre un fork
de `LIDR-academy/flowsync-ai4devs`.

> Este archivo es el **contexto** del harness. No lleva bloque gestionado por
> `ryndem-standards`: el catálogo de estándares no tiene un perfil para este stack, así
> que todo lo de aquí está escrito y mantenido a mano. Ver «Qué estándar rige».

## Stack

Versiones leídas de los `package.json`, no supuestas.

| | Backend (`backend/`) | Frontend (`frontend/`) |
|---|---|---|
| Framework | AdonisJS 7 (`@adonisjs/core ^7.3.3`) | React 19 (`react ^19.2.7`) |
| Lenguaje | TypeScript `~6.0.3`, ESM (`"type": "module"`) | TypeScript `~6.0.2`, ESM |
| Build / dev | `@adonisjs/assembler`, HMR vía `node ace` | Vite `^8.1.1` |
| ORM / datos | Lucid `^22.4.2` sobre **SQLite** (`better-sqlite3`) | — |
| Validación | VineJS `^4.4.0` | — |
| Auth | `@adonisjs/auth ^10.1.0`, access tokens | — |
| Pruebas | Japa (`@japa/runner ^5.3.0`) | Vitest + Testing Library, sobre jsdom |
| Lint / formato | ESLint + Prettier (configs de AdonisJS) | oxlint `^1.71.0` |

Runtime verificado en esta máquina: Node `v24.21.0`, npm `11.19.0`.

La base es SQLite en `backend/tmp/db.sqlite3` (`config/database.ts`). PostgreSQL está
comentado ahí mismo como alternativa; **no está instalado**.

## Mapa de carpetas

```
backend/
  app/
    controllers/   access_tokens, new_account, profile
    models/        user.ts
    validators/    user.ts            (VineJS: loginValidator, signupValidator)
    transformers/  user_transformer.ts
    middleware/    auth, silent_auth, force_json_response, container_bindings
    exceptions/    handler.ts
  database/
    migrations/    users, access_tokens
    schema.ts      GENERADO — no editar a mano
  start/           routes.ts, kernel.ts, env.ts, validator.ts
  config/          database.ts, y demás configuración de AdonisJS
  tests/           bootstrap.ts        (aún sin pruebas)
frontend/
  src/             App.tsx, main.tsx, assets/
                   App.test.tsx      pruebas (Vitest)
                   test-setup.ts     setupFiles: matchers de jest-dom + cleanup
  vite.config.ts   config de Vite Y de Vitest (bloque `test`)
```

Las rutas se declaran en `backend/start/routes.ts`, todas bajo el prefijo `/api/v1`:

- `POST /api/v1/auth/signup`, `POST /api/v1/auth/login` — públicas
- `GET /api/v1/account/profile`, `POST /api/v1/account/logout` — tras `middleware.auth()`

Los controladores se referencian por el registro generado (`#generated/controllers`), no
por import directo. Al agregar uno, el registro se regenera solo; no lo edites.

## Verificación

El harness de este repositorio vive en **`frontend/`**, que es donde se trabaja. Tiene
dos piezas y se complementan: una automática que atrapa lo mecánico, y un revisor al
que se le pide criterio.

### 1. Automática — se dispara sola

`.claude/verify-frontend.sh`, enganchado como hook **`PostToolUse`** sobre `Write|Edit`.
No hay que invocarlo ni recordarlo: **corre solo al terminar de editar** cualquier
`.ts`, `.tsx`, `.js` o `.jsx` bajo `frontend/`. Hace dos cosas:

1. `oxlint` sobre el archivo editado — primero `--fix` para lo autocorregible, luego
   una segunda pasada que **sí bloquea** si queda algún `error`. Los `warn` se informan
   pero no detienen.
2. `tsc --noEmit` **acotado al archivo editado** — si los tipos fallan, **bloquea**.

Cualquiera de los dos que falle sale con **código 2**, y el error vuelve al agente para
que lo corrija en el mismo turno.

**No hay formateador.** El frontend no tiene Prettier ni oxfmt, y `.oxlintrc.json` solo
activa dos reglas (`rules-of-hooks` y `only-export-components`), así que el `--fix` en la
práctica casi nunca cambia nada — medido, no supuesto. El hook cubre **lint y tipos**,
no formato. Si quieres formato automático hay que añadir un formateador.

El chequeo de tipos usa un `tsconfig` efímero que **hereda** el del proyecto
(`tsconfig.app.json` para `src/`, `tsconfig.node.json` para la raíz) y restringe
`files` al archivo editado más los ambientales (`test-setup.ts` y los `.d.ts`). No se
le pasa el archivo suelto a `tsc` a propósito: hacerlo **ignora el tsconfig** y se
pierden `jsx`, `lib` y los tipos de `vite/client`.

**Qué ve y qué no.** Ve el archivo editado y todo lo que ese archivo importa — si
llamas mal a una función de otro módulo, lo atrapa. **No ve a quien importa el
archivo**: si cambias las props de un componente, el error sale al editar a su
consumidor, no aquí. El chequeo completo es `npm run typecheck`, y lo corre el `build`.

Fuera de `frontend/` no hace nada, y sin `node_modules` instalado tampoco: un cambio en
`backend/` no dispara esto.

### 2. Revisor — se pide

El subagente **`revisor-frontend`** (`.claude/agents/revisor-frontend.md`) lee el diff de
`frontend/` y reporta lo que una herramienta no ve: corrección, contrato con el API,
accesibilidad, convenciones. Es de solo lectura. Pídelo al cerrar un cambio:

> «revisa el frontend con revisor-frontend»

### 3. A mano

Lo que el hook no cubre, o para comprobar todo de una:

| Qué | Comando | Estado verificado hoy |
|---|---|---|
| **Pruebas, frontend** | `cd frontend && npm test` | ✅ 2 pasando (Vitest) |
| Pruebas en watch | `cd frontend && npm run test:watch` | — |
| Tipos completos, frontend | `cd frontend && npm run typecheck` | ✅ limpio |
| Lint, frontend | `cd frontend && npm run lint` | ✅ limpio |
| Build, frontend | `cd frontend && npm run build` | ✅ (`tsc -b && vite build`) |
| Tipos, backend | `cd backend && npm run typecheck` | ✅ limpio |
| Lint, backend | `cd backend && npm run lint` | ⚠️ 1 error preexistente |
| Pruebas, backend | `cd backend && npm test` | Sin pruebas todavía |

El error de lint preexistente es de formato (`prettier/prettier`) en
`backend/database/schema.ts`, que es **generado**. No lo arregles a mano de paso en otra
tarea: o se corrige aparte y a conciencia, o se deja.

### Pruebas del frontend

**Vitest** sobre jsdom, con Testing Library. Configurado en `vite.config.ts` (bloque
`test`), con `src/test-setup.ts` cargado por `setupFiles` para los matchers de jest-dom
y el `cleanup()` entre pruebas.

**Los archivos se llaman `*.test.ts` / `*.test.tsx`, nunca `*.spec.ts`.** No es estilo:
el hook `validate-test-names.py` del plugin de estándares se dispara con el sufijo
`.spec.ts` y exige descripciones en español (`it('debe ...')`). Con `.test.tsx` no
aplica y puedes escribirlas en inglés, como el resto del código. El `include` de
Vitest solo mira `src/**/*.test.{ts,tsx}`.

Se consulta por rol y nombre accesible (`getByRole`), no por clase CSS: así la prueba
sobrevive a un cambio de maquetado y falla si el control deja de ser accesible.

### Levantar

```bash
cd backend  && npm run dev   # node ace serve --hmr  → http://localhost:3333
cd frontend && npm run dev   # vite                  → http://localhost:5173
```

Cada uno en su terminal. El backend necesita `APP_KEY` en `.env` (ver `.env.example`, donde
viene vacía) y `CORS_ORIGIN` si el front le va a pegar desde otro puerto.

## Qué estándar rige

El repositorio está dado de alta con `.claude/ryndem.json` como **`class: tooling`** y
**`stacks: []`**. Eso significa, en concreto:

- **Sí rige** la skill `ryndem-engineering` — políticas agnósticas de tecnología:
  principios y su orden de prioridad, idioma de los identificadores, seguridad,
  observabilidad, rendimiento, pruebas, documentación y versionado. Léela antes de decidir
  cómo nombrar, qué documentar o qué probar.
- **Sí rige** el formato de commit: Conventional Commits. El scope es libre, y se prefiere
  **omitido**. Sin trailer `Ticket:`.
- **No rige** el modelo de ramas de Ryndem. Las ramas de este repo son las del curso
  (`s1/start` y sucesivas); el validador ni las mira.
- **No rige** ningún estándar de stack. No hay perfil de Ryndem para AdonisJS ni para
  React, así que para todo lo específico del framework manda la convención del propio
  framework y la coherencia con el código que ya está aquí.

Regla de desempate cuando algo no esté cubierto: **coherencia local primero** — el código
nuevo sigue el patrón del ámbito donde vive.

## Idioma

`language.default: "en"`. Los identificadores van en **inglés**, como todo lo que ya
existe: `AccessTokensController`, `UserTransformer`, `ForceJsonResponseMiddleware`,
`loginValidator`, `signupValidator`. Los comentarios y la documentación, en español.

## Trampas conocidas

- **Los tests `.spec.ts` te van a exigir español.** El hook `validate-test-names.py` del
  plugin se dispara con cualquier archivo `*.spec.ts` —que es justo la convención de
  AdonisJS y Japa— y exige que la descripción empiece por `debe`:
  `it('debe <resultado> cuando <escenario>')`. La palabra está fija en el hook y **no la
  cambia** el `language.default: "en"` de este repo. Hoy no hay ningún `.spec.ts`, así que
  está inerte; en cuanto escribas el primero, el `Write` se bloquea si no sigue esa forma.
  **Aplica también al frontend.** Por eso las pruebas de aquí se llaman `*.test.tsx` y
  no `*.spec.tsx`: el hook solo mira el sufijo `.spec.ts`. Si renombras una a `.spec`,
  te caerá encima la regla del español.
- **El hook NO ve a quien importa el archivo que editas.** Revisa el archivo y sus
  importaciones. Si cambias la firma de un componente, sus consumidores siguen rotos y
  el hook calla hasta que los toques. Antes de cerrar un cambio que altera una interfaz:
  `cd frontend && npm run typecheck`.
- **Un `.d.ts` o un `setupFiles` nuevo hay que sumarlo al hook.** El config efímero
  incluye `src/test-setup.ts` y los `.d.ts` de `src/` por nombre; si añades otro archivo
  que declare tipos globales sin ser importado, el chequeo acotado no lo verá y dará
  errores falsos.
- **`backend/database/schema.ts` es generado.** Editarlo a mano se pierde en la siguiente
  regeneración.
- **`backend/package-lock.json` aparece modificado** en el árbol desde antes de esta
  configuración. No lo incluyas en un commit sin mirar qué cambió.
- `<pendiente: añade aquí lo que descubras y cueste trabajo redescubrir>`

## Áreas sensibles

- `backend/app/middleware/auth_middleware.ts` y `silent_auth_middleware.ts`, más
  `config/auth.ts` — tocar la autenticación afecta a todas las rutas de `/api/v1/account`.
- `backend/database/migrations/` — una migración ya aplicada no se edita; se agrega otra.
- `backend/start/kernel.ts` — el orden de los middleware importa.
- `.claude/verify-frontend.sh` y `.claude/settings.json` — son el harness mismo. Tocarlos
  cambia qué se verifica; si el hook deja de fallar, comprueba que no lo rompiste.
- `<pendiente: llénalo conforme conozcas el proyecto>`
