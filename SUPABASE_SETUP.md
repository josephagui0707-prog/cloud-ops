# Configurar Supabase en CloudOps

El proyecto ahora conserva las simulaciones en `localStorage` y, cuando Supabase está configurado, también las sincroniza con la nube. El simulador de fallos y el límite de presupuesto del escenario se guardan en la misma fila.

## 1. Crear la tabla

1. Entra a tu proyecto de Supabase.
2. Abre **SQL Editor**.
3. Copia y ejecuta el contenido de `supabase/schema.sql`.

## 2. Crear el archivo `.env`

Copia `.env.example` como `.env` y reemplaza los valores:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_SUPABASE_WORKSPACE_ID=cloudops-demo
```

La URL y la `anon key` están en **Project Settings > API**.

## 3. Ejecutar

```bash
npm install
npm run dev
```

## Qué se guarda

Cada fila en `cloudops_simulations` contiene:

- Datos completos de la planificación en `simulation` (JSON).
- Configuración del simulador de fallos en `failure_config`.
- Límite de presupuesto en `budget_limit`.
- Fechas de creación y actualización.

Si Supabase no está configurado o no responde, la aplicación continúa funcionando con `localStorage` como respaldo local.

> Las políticas incluidas permiten acceso con la anon key para facilitar la demostración académica. Para un sistema real debe utilizarse Supabase Auth y políticas RLS por usuario u organización.
