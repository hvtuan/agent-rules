import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { z } from 'zod';
import { UserClient } from '../clients/user.client';

// Demonstrates the prescribed API pattern: the `request` fixture (APIRequestContext)
// + a service-client + zod contract validation, against a tiny local stub server
// (fully offline). The other API example (api-users.spec.ts) shows the page.evaluate
// workaround; this one shows the real request-fixture path.

const UsersSchema = z.array(z.object({ id: z.number(), name: z.string() }));

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/users') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify([{ id: 1, name: 'Ada' }]));
    } else if (req.url === '/users/999') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

test('@smoke TC-API-010 user service-client returns a typed list', async ({ request }) => {
  const client = new UserClient(request, baseURL);
  const res = await client.list();
  expect(res.ok()).toBeTruthy();
  const users = UsersSchema.parse(await res.json()); // throws on contract violation
  expect(users[0]?.name).toBe('Ada');
});

test('@regression TC-API-011 unknown user returns 404', async ({ request }) => {
  const client = new UserClient(request, baseURL);
  const res = await client.get(999);
  expect(res.status()).toBe(404);
});
