#!/bin/bash

# Script helper para realizar commits con autores simulados según el módulo.
# Uso: bash agents/scripts/commit.sh <modulo> "<mensaje>"

if [ "$#" -ne 2 ]; then
    echo "Uso: bash agents/scripts/commit.sh <modulo> \"<mensaje>\""
    echo "Módulos válidos: gateway, infra, payment, auth, resource, booking, notification, user"
    exit 1
fi

MODULO=$1
MSG=$2

case $MODULO in
    gateway|infra|payment|whatsapp|telegram|notification|auth)
        NAME="Alan"
        EMAIL="alanyr107@gmail.com"
        ;;
    booking|user|resource)
        NAME="Laura Perez"
        EMAIL="20233tn113@utez.edu.mx"
        ;;
    *)
        echo "Error: Módulo desconocido '$MODULO'."
        echo "Módulos válidos: gateway, infra, payment, auth, resource, booking, notification, user, whatsapp, telegram"
        exit 1
        ;;
esac

# Verificar si hay cambios en el stage
if git diff --cached --quiet; then
    echo "Error: No hay cambios en el stage. Ejecuta 'git add' primero."
    exit 1
fi

echo "💾 Realizando commit para el módulo '$MODULO'..."
echo "👤 Autor: $NAME <$EMAIL>"

GIT_AUTHOR_NAME="$NAME" \
GIT_AUTHOR_EMAIL="$EMAIL" \
GIT_COMMITTER_NAME="$NAME" \
GIT_COMMITTER_EMAIL="$EMAIL" \
git commit -m "$MSG"

echo "✅ Commit realizado con éxito."
