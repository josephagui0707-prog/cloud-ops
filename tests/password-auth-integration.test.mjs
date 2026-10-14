import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const read = name => readFileSync(resolve(process.cwd(), name), 'utf8');

test('Las contraseñas antiguas no se envían en JavaScript público', () => {
 const users = read('src/data/mockUsers.ts');
 assert.equal(users.includes('password:'), false);
 assert.equal(users.includes('sandro2026'), false);
 assert.equal(users.includes('admin2026'), false);
});
test('El login utiliza Supabase password grant y no OAuth Google', () => {
 const auth = read('src/lib/supabasePasswordAuth.ts');
 const login = read('src/pages/Login.tsx');
 assert.match(auth, /grant_type=\$\{grant\}/);
 assert.match(auth, /signInPassword/);
 assert.equal(login.includes('Continuar con Google'), false);
});
test('La API exige sesión y permite guardar historial propio con RLS', () => {
 const server = read('server/index.mjs');
 const sql = read('supabase/ai_analysis_secure.sql');
 assert.match(server, /\/auth\/v1\/user/);
 assert.match(server, /Bearer/);
 assert.match(sql, /auth\.uid\(\)/);
});
