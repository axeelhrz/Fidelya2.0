#!/bin/bash

# Script to configure CORS for Firebase Storage
# This script applies the CORS configuration to Firebase Storage

echo "🔧 Configurando CORS para Firebase Storage..."

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil no está instalado. Instalando Google Cloud SDK..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "📦 Instalando Google Cloud SDK con Homebrew..."
            brew install --cask google-cloud-sdk
        else
            echo "❌ Homebrew no está disponible. Por favor, instala Google Cloud SDK manualmente:"
            echo "https://cloud.google.com/sdk/docs/install"
            exit 1
        fi
    else
        echo "❌ Por favor, instala Google Cloud SDK manualmente:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
fi

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "❌ Archivo cors.json no encontrado en el directorio actual"
    exit 1
fi

# Apply CORS configuration
echo "📤 Aplicando configuración CORS..."
gsutil cors set cors.json gs://fidelita-16082.firebasestorage.app

if [ $? -eq 0 ]; then
    echo "✅ Configuración CORS aplicada exitosamente"
    
    # Verify CORS configuration
    echo "🔍 Verificando configuración CORS..."
    gsutil cors get gs://fidelita-16082.firebasestorage.app
else
    echo "❌ Error aplicando configuración CORS"
    echo "💡 Asegúrate de estar autenticado con Google Cloud:"
    echo "   gcloud auth login"
    echo "   gcloud config set project fidelita-16082"
    exit 1
fi

echo "🎉 Configuración CORS completada"