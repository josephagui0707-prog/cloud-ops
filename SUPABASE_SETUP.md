# Simulaciones en Supabase

Las simulaciones, los presupuestos y la configuración de fallos se guardan únicamente en Supabase. No se leen ni escriben simulaciones en localStorage. Los datos locales anteriores no se importan automáticamente.

1. Ejecuta `supabase/schema.sql` en SQL Editor de tu proyecto Supabase.
2. El archivo `.env` incluye la URL y clave pública de tu proyecto. Nunca pongas una clave secreta o service_role en este archivo.
3. Ejecuta `npm install` y `npm run dev`.
4. Guarda una planificación. Espera el aviso «Simulación guardada en Supabase» y recarga para comprobar que se recupera.

Si falla Supabase, se muestra un error. Los cambios en memoria no están guardados y se pierden al cerrar la página. El login incluido sigue siendo una demostración; la tabla comparte los escenarios del grupo con políticas de prototipo. No uses esta configuración para información privada.

Tema y sesión pueden conservar sus preferencias locales; las simulaciones no. El historial de actividad permanece en memoria durante la sesión.
