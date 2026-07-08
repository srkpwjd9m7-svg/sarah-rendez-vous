#!/usr/bin/env bash
# sarah-rdv-backlog-load.sh — hook SessionStart : charge les tickets #sarah-rdv OUVERTS depuis le
# backlog serveur (source de vérité `backlog.d/sarah-rdv.md`, rendu live sur le hub Asimov).
#
# Pourquoi : sans hook, une session n'attaque son backlog qu'après injonction explicite
# (constat INF-13). Le hook matérialise le rituel — il INJECTE les tickets ouverts au début
# de session (stdout d'un hook SessionStart = contexte pour l'assistant).
#
# Lecture seule. Ne BLOQUE jamais (exit 0) : si SSH est KO, un message le dit, pas d'échec.
set +e
H="${OC_HOST:-root@atlas.bourdat.fr}"
BL="/root/.openclaw/server-context/backlog.d/sarah-rdv.md"

echo "[sarah-rdv] Tickets OUVERTS (source de vérité : $BL — rendu sur asimov.bourdat.fr) :"
out="$(ssh -o ConnectTimeout=8 -o BatchMode=yes "$H" \
  "grep -nE '^\[(P[0-4]|quickwin|wishlist)\]\[(todo|progress)\]' $BL 2>/dev/null" 2>/dev/null)"
if [ -n "$out" ]; then
  printf '%s\n' "$out"
  echo "→ Propose-les à Loïc et dépile le mieux priorisé non bloqué. Statut à jour (progress/done)"
  echo "  dans backlog.d/sarah-rdv.md ; AJOUT via 'oc-backlog add' (jamais l'ancien monolithe backlog.md)."
else
  echo "  (aucun ticket ouvert, ou backlog injoignable — vérifier la connexion SSH atlas)"
fi
exit 0
