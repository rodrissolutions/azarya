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

2. Crear las bases y el rol (una sola vez), desde `psql` como administrador:

   ```sql
   CREATE ROLE azarya_app WITH LOGIN PASSWORD 'tu_clave';
   CREATE DATABASE azarya OWNER azarya_app ENCODING 'UTF8';
   CREATE DATABASE azarya_test OWNER azarya_app ENCODING 'UTF8';
   ```

3. Configurar el entorno:

   ```
   cp .env.example .env
   ```

   Edita `.env` con tu clave real (`DATABASE_URL` y `TEST_DATABASE_URL`).

   Si la clave tiene símbolos, deben ir codificados en la URL (por ejemplo `*` → `%2A`).

4. Aplicar las migraciones:

   ```
   pnpm --filter @azarya/db db:migrate
   pnpm --filter @azarya/db db:migrate:test
   ```

## Scripts

| Comando                                    | Qué hace                                   |
| ------------------------------------------ | ------------------------------------------ |
| `pnpm lint`                                | Revisa el código con ESLint                |
| `pnpm format`                              | Da formato con Prettier                    |
| `pnpm format:check`                        | Comprueba el formato sin modificar         |
| `pnpm typecheck`                           | Verifica tipos en todo el monorepo         |
| `pnpm --filter @azarya/db db:generate`     | Genera una migración desde el esquema      |
| `pnpm --filter @azarya/db db:migrate`      | Aplica migraciones a la base de desarrollo |
| `pnpm --filter @azarya/db db:migrate:test` | Aplica migraciones a la base de pruebas    |
| `pnpm --filter @azarya/db test`            | Ejecuta los invariantes del modelo         |

## Estructura

```
apps/               aplicaciones (web, api)
packages/contracts  tipos y esquemas Zod compartidos, contrato GameModule
packages/db         esquema Drizzle, migraciones y tests de invariantes
```

## Estructura

```
apps/        aplicaciones (web, api)
packages/    paquetes compartidos (contracts)
```
