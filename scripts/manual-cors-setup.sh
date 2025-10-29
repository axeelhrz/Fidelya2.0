#!/bin/bash

# Manual CORS setup script for Firebase Storage
# This script applies CORS configuration manually

echo "🔧 Configuración manual de CORS para Firebase Storage..."

# Check if gsutil is available
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil no está disponible. Instala Google Cloud SDK primero:"
    echo "   brew install --cask google-cloud-sdk"
    echo "   O descarga desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "❌ Archivo cors.json no encontrado"
    exit 1
fi

echo "📋 Contenido del archivo cors.json:"
cat cors.json

echo ""
echo "🔑 Verificando autenticación..."

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ No estás autenticado con Google Cloud"
    echo "💡 Ejecuta: gcloud auth login"
    echo "💡 Luego configura el proyecto: gcloud config set project fidelita-16082"
    exit 1
fi

echo "✅ Usuario autenticado"

# Set project
echo "🔧 Configurando proyecto..."
gcloud config set project fidelita-16082

# Apply CORS configuration
echo "📤 Aplicando configuración CORS..."
gsutil cors set cors.json gs://fidelita-16082.firebasestorage.app

if [ $? -eq 0 ]; then
    echo "✅ Configuración CORS aplicada exitosamente"
    
    # Verify CORS configuration
    echo "🔍 Verificando configuración CORS..."
    gsutil cors get gs://fidelita-16082.firebasestorage.app
    
    echo ""
    echo "🎉 ¡Configuración CORS completada!"
    echo "💡 Ahora puedes probar subir imágenes en tu aplicación"
    echo "💡 Si persisten los errores, reinicia el servidor de desarrollo"
else
    echo "❌ Error aplicando configuración CORS"
    echo "💡 Verifica que tengas permisos en el proyecto Firebase"
    exit 1
fi