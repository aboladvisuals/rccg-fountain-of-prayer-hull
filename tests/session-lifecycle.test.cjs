/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServerClient } = require('@supabase/ssr');

test('real SSR SDK persists, refreshes and clears cookies with an isolated Auth transport', async () => {
  const jar = new Map();
  const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const token = (suffix) => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),aud:'authenticated',role:'authenticated',test:suffix})}.fixture-signature`;
  };
  let refreshes = 0;
  const calls = [];
  const cacheHeaders = [];
  const transport = async (input, init = {}) => {
    const url = new URL(input); calls.push(url.pathname + url.search);
    if (url.pathname.endsWith('/otp')) return Response.json({});
    if (url.pathname.endsWith('/token')) {
      const body = JSON.parse(init.body);
      if (url.searchParams.get('grant_type') === 'pkce') {
        assert.equal(body.auth_code, 'fixture-code'); assert.ok(body.code_verifier);
      } else { assert.equal(body.refresh_token, 'fixture-refresh'); refreshes++; }
      return Response.json({access_token:token(refreshes),refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user});
    }
    if (url.pathname.endsWith('/user')) return Response.json(user);
    if (url.pathname.endsWith('/logout')) return new Response(null, {status:204});
    throw new Error(`Unexpected isolated auth request ${url.pathname}`);
  };
  const client = () => createServerClient('https://fixture.supabase.co', 'fixture-anon-key', {
    global:{fetch:transport}, cookies:{
      getAll:()=>[...jar].map(([name,value])=>({name,value})),
      setAll:(changes, headers)=>{
        cacheHeaders.push(headers);
        changes.forEach(({name,value,options})=>{if(options.maxAge===0) jar.delete(name);else jar.set(name,value);});
      },
    },
  });
  const requestingClient = client();
  assert.equal((await requestingClient.auth.signInWithOtp({email:user.email,options:{emailRedirectTo:'http://localhost:3000/auth/callback'}})).error, null);
  assert.ok([...jar.keys()].some(name=>name.includes('code-verifier')));
  const callbackClient = client();
  assert.equal((await callbackClient.auth.exchangeCodeForSession('fixture-code')).error,null);
  assert.ok([...jar.keys()].some(name=>name.includes('auth-token')));
  const reloadedClient = client();
  assert.equal((await reloadedClient.auth.getUser()).data.user.id,user.id);
  assert.equal((await reloadedClient.auth.refreshSession()).error,null);
  assert.equal(refreshes,1);
  assert.ok(cacheHeaders.some(headers=>Object.values(headers).some(value=>value.includes('no-store'))));
  assert.equal((await client().auth.getUser()).data.user.id,user.id);
  assert.equal((await client().auth.signOut({scope:'local'})).error,null);
  assert.equal((await client().auth.getUser()).data.user,null);
  assert.equal(jar.size,0);
  assert.ok(calls.includes('/auth/v1/logout?scope=local'));
});
