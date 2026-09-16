#!/bin/sh
# Pieza de verificación del harness: se dispara SOLO, al terminar un Write/Edit.
# Hook PostToolUse declarado en .claude/settings.json.
#
# Alcance deliberado: solo archivos de `frontend/`. El backend no lo toca —
# el harness de este repositorio vive en el frontend.
#
# Qué hace, en orden:
#   1. oxlint         sobre el archivo editado   (--fix, y luego bloquea si queda error)
#   2. tsc --noEmit   sobre el archivo editado   (tipos, acotado)
#
# POR QUÉ UN TSCONFIG EFÍMERO: `tsc archivo.tsx` IGNORA el tsconfig del proyecto,
# así que perderíamos jsx, lib, target y los tipos de vite/client — y el chequeo
# fallaría por razones falsas. Lo que sí funciona es un config que HEREDA el del
# proyecto y solo restringe `files`. TypeScript arrastra ademas lo que el archivo
# importa, que es justo lo que hace falta para que el chequeo signifique algo.
#
# LÍMITE CONOCIDO: se revisa el archivo editado y sus importaciones, NO quien lo
# importa. Si cambias las props de un componente, el error aparece al editar a
# quien lo usa, no aquí. Para el chequeo completo: `cd frontend && npm run typecheck`.
set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
FRONTEND="$ROOT/frontend"

FILE=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
[ -n "$FILE" ] || exit 0

case "$FILE" in "$FRONTEND"/*) ;; *) exit 0 ;; esac
case "$FILE" in *.ts|*.tsx|*.js|*.jsx) ;; *) exit 0 ;; esac
[ -f "$FILE" ] || exit 0

[ -x "$FRONTEND/node_modules/.bin/oxlint" ] || exit 0
[ -x "$FRONTEND/node_modules/.bin/tsc" ] || exit 0

cd "$FRONTEND" || exit 0

# 1. Autocorrección, y luego comprobación. Son DOS pasadas a propósito: la primera
#    arregla lo arreglable, la segunda mira qué quedó. Ignorar la salida de oxlint
#    dejaba pasar todo lo que no es autocorregible —`rules-of-hooks`, por ejemplo—
#    que es justo lo que más caro sale descubrir tarde.
#
#    OJO: con el `.oxlintrc.json` actual (dos reglas) el `--fix` casi nunca cambia
#    nada, y no hay formateador en el proyecto. Esto NO formatea; comprueba.
"$FRONTEND/node_modules/.bin/oxlint" --fix "$FILE" >/dev/null 2>&1

LINT_OUT=$("$FRONTEND/node_modules/.bin/oxlint" "$FILE" 2>&1)
LINT_CODE=$?

# Solo los `error` bloquean. Los `warn` se informan pero no detienen: `.oxlintrc.json`
# declara `only-export-components` como warning a propósito, y convertirlo en bloqueo
# aquí sería endurecer la regla por la puerta de atrás.
if [ $LINT_CODE -ne 0 ]; then
  printf 'El linter del frontend falló tras editar %s\n\n' "${FILE#"$ROOT/"}" >&2
  printf '%s\n\n' "$LINT_OUT" >&2
  printf 'Reproducir: cd frontend && npx oxlint %s\n' "${FILE#"$FRONTEND/"}" >&2
  exit 2
fi

# 2. Tipos, acotados al archivo. `src/` lo cubre tsconfig.app.json; lo de la raíz
#    (vite.config.ts) lo cubre tsconfig.node.json. Elegir mal el base da errores falsos.
case "$FILE" in
  "$FRONTEND"/src/*) BASE="$FRONTEND/tsconfig.app.json" ;;
  *)                 BASE="$FRONTEND/tsconfig.node.json" ;;
esac
[ -f "$BASE" ] || exit 0

# El config efímero vive DENTRO de frontend/, no en /tmp: TypeScript resuelve
# `types` y los módulos subiendo node_modules desde la carpeta del config, así que
# desde /tmp no encontraría `vite/client` ni `node` y fallaría por razón falsa.
# node_modules/ ya está en .gitignore, así que esto nunca aparece en el árbol.
TMP="$FRONTEND/node_modules/.tmp"
mkdir -p "$TMP" || exit 0
CFG="$TMP/hook-tsconfig-$$.json"

# `composite`/`incremental` en false: el config del proyecto apunta su tsbuildinfo a
# una ruta compartida, y escribirla desde aquí corrompería el estado de `tsc -b`.
# Archivos AMBIENTALES: los que declaran tipos globales sin que nadie los importe.
# `test-setup.ts` amplía el `expect` de Vitest con los matchers de jest-dom, y Vitest
# lo carga por `setupFiles`, no por un import. Revisando un .test.tsx aislado esa
# ampliación no existiría y `toBeInTheDocument` daría un error falso. Los .d.ts van
# por la misma razón. Se añaden siempre; el propio archivo editado se filtra para no
# duplicarlo, que `files` no admite repetidos.
AMBIENT=""
for a in "$FRONTEND/src/test-setup.ts" $(find "$FRONTEND/src" -name '*.d.ts' 2>/dev/null); do
  [ -f "$a" ] || continue
  [ "$a" = "$FILE" ] && continue
  AMBIENT="$AMBIENT,
    \"$a\""
done

cat > "$CFG" <<JSON
{
  "extends": "$BASE",
  "compilerOptions": { "noEmit": true, "composite": false, "incremental": false },
  "files": [
    "$FILE"$AMBIENT
  ],
  "include": []
}
JSON

TSC_OUT=$("$FRONTEND/node_modules/.bin/tsc" --noEmit -p "$CFG" 2>&1)
TSC_CODE=$?
rm -f "$CFG"

if [ $TSC_CODE -ne 0 ]; then
  printf 'La verificación del frontend falló tras editar %s\n\n' "${FILE#"$ROOT/"}" >&2
  printf '%s\n\n' "$TSC_OUT" >&2
  printf 'Corrige los errores de tipo antes de continuar.\n' >&2
  printf 'Reproducir el proyecto completo: cd frontend && npm run typecheck\n' >&2
  exit 2
fi

exit 0
