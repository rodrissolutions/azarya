# Azarya

Plataforma multi-juego de generación, venta, sorteo, animación y verificación de ganadores. Juegos iniciales: **Bingo** y **Rifa**.

## Requisitos

- Node 24 (ver `.nvmrc`)
- pnpm 12
- PostgreSQL 18 en local

## Puesta en marcha

1. Instalar dependencias:

   ```
   pnpm install
   ```

2. Crear la base de datos y el rol (una sola vez), desde `psql` como administrador:

   ```sql
   CREATE ROLE azarya_app WITH LOGIN PASSWORD 'tu_clave';
   CREATE DATABASE azarya OWNER azarya_app ENCODING 'UTF8';
   ```

3. Configurar el entorno:

   ```
   cp .env.example .env
   ```

   Edita `.env` con tu clave real.

## Scripts

| Comando             | Qué hace                           |
| ------------------- | ---------------------------------- |
| `pnpm lint`         | Revisa el código con ESLint        |
| `pnpm format`       | Da formato con Prettier            |
| `pnpm format:check` | Comprueba el formato sin modificar |
| `pnpm typecheck`    | Verifica tipos en todo el monorepo |

## Estructura

```
apps/        aplicaciones (web, api)
packages/    paquetes compartidos (contracts)
```
