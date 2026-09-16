#!/bin/sh
# Deja el plugin de estándares instalado y al día en la máquina de quien abre este
# repositorio. Lo invoca el hook SessionStart declarado en .claude/settings.json.
#
# No bloquea: SessionStart no puede detener el arranque de la sesión, y esto tampoco
# debe retrasarlo. Si algo falla, la sesión sigue sin el plugin y se reintenta en la
# siguiente. Por eso todo va silenciado y siempre sale con 0.
#
# NO EDITAR A MANO. Se distribuye desde ryndem/engineering-standards.
STAMP="${TMPDIR:-/tmp}/.ryndem-standards-checked"

# Refresca el catálogo del marketplace. Va en los dos caminos, no solo en el del
# install, porque `plugin update` resuelve la versión contra el catálogo local: con
# el catálogo viejo la versión resuelta coincide con la instalada y el update se
# salta en silencio. Sin esto, una versión nueva no llega nunca a un repo que ya
# tiene el plugin.
#
# Y va en un comando que lanzamos nosotros, no en el auto-update interno de Claude
# Code: ese deshabilita los credential helpers para su `git pull`, así que contra un
# marketplace PRIVADO por HTTPS no autentica. Lo que corremos nosotros sí usa las
# credenciales guardadas — por eso no hace falta configurar SSH en ninguna máquina.
refresh_catalog() {
  claude plugin marketplace update ryndem >/dev/null 2>&1 \
    || claude plugin marketplace add ryndem/engineering-standards >/dev/null 2>&1
}

# El scope va EXPLÍCITO en los dos comandos. `install` y `update` resuelven ambos a
# `user` por omisión, así que esto no cambia lo que hacen hoy: lo fija. Importa
# porque una copia instalada en scope `project` queda clavada a la ruta de ese
# repositorio y este hook no la vuelve a tocar nunca —el `update` de más abajo
# actúa sobre `user`—, así que se congela en la versión con la que nació y aparece
# en `claude plugin list` como si conviviera con la buena. Con el scope escrito, ni
# un cambio de la omisión del CLI ni una instalación a mano dentro de un
# repositorio pueden dejar una copia huérfana.

# El sello cierra la puerta ANTES de preguntar nada. Es lo primero a propósito:
# `claude plugin list` spawnea el CLI completo y cuesta ~1 s medido en Windows,
# mientras que esta comprobación responde en ~0.1 s. Preguntar primero y sellar
# después —como estaba hasta 0.20.7— pagaba ese segundo en cada arranque, de cada
# sesión, en cada repositorio y para los 12.
#
# El precio de invertirlo: si alguien desinstala el plugin a mano, tarda hasta 24 h
# en reponerse. Se acepta, porque es raro y se cura solo.
[ -n "$(find "$STAMP" -mtime -1 2>/dev/null)" ] && exit 0

if ! claude plugin list 2>/dev/null | grep -q 'ryndem-standards@ryndem'; then
  # El marketplace tiene que estar registrado Y con su catálogo clonado antes del
  # install. No se asume ninguna de las dos cosas: el orden entre este hook y el
  # registro de `extraKnownMarketplaces` no está garantizado, y sin el refresco el
  # install falla con "not found in marketplace".
  refresh_catalog
  claude plugin install ryndem-standards@ryndem --scope user >/dev/null 2>&1
  # NO se sella. Si el install falló hay que reintentar en la siguiente sesión, no
  # dentro de 24 horas.
  exit 0
fi

# Instalado: revisar actualización como mucho una vez al día, y en segundo plano,
# para no pagar dos llamadas de red en el arranque.
#
# El sello se pone DESPUÉS y solo si el update salió bien. Sellar antes compraba 24 h
# de silencio también cuando fallaba —red caída, credenciales vencidas, marketplace
# inalcanzable—, que es justo cuando hace falta reintentar. `plugin update` sale con 0
# cuando ya está en la última versión, así que el camino normal sella igual.
{ refresh_catalog; claude plugin update ryndem-standards@ryndem --scope user >/dev/null 2>&1 && touch "$STAMP" 2>/dev/null; } &
exit 0
