# SentinelTrace - Defensive Canary & Threat Triage Platform

Sistema de ciberdefensa para generar hojas de cálculo Excel trampa (honeytokens), detectar IP de atacantes, auditar correos comprometidos e inspeccionar documentos maliciosos.

## Requisitos Previos
- Node.js versión 18 o superior
- npm

## Instalación y Ejecución Rápida
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev
```
Abre en tu navegador:
```
http://localhost:3000
```

## Despliegue en un Servidor VPS (Producción)
1. Compilar para producción:
   ```bash
   npm run build
   ```
2. Iniciar el servidor:
   ```bash
   npm start
   ```
3. Si utilizas un dominio o IP pública fija, define en tu archivo `.env`:
   ```env
   APP_URL="https://tu-dominio.com"
   ```
