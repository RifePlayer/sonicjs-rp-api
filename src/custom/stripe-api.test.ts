import app from '../server';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { getRecords, insertRecord } from '../cms/data/data';
import { migrateData } from './migrate-data';
import { insertD1Data } from '../cms/data/d1-data';
import { createUserTestTables, getTestingContext } from '../cms/util/testing';

const ctx = getTestingContext();
import {stripeJson} from './mocks/stripe'
it('rp controller sanity', async () => {
  // await createTestTable(ctx);

  // await migrateData(ctx, 20);

  let req = new Request('http://localhost/v1/stripe-rp-webhook', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  let res = await app.fetch(req, ctx.env);
  expect(res.status).toBe(200);
});



it('stripe webhook handler should consume payload', async () => {
  // await createContactTable(ctx);

  let payload = JSON.stringify(stripeJson);

  let req = new Request('http://localhost/v1/stripe-rp-webhook', {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': ctx.env.STRIPE_ENDPOINT_SECRET
    }
  });
  let res = await app.fetch(req, ctx.env);
  expect(res.status).toBe(200);
  let body = await res.json();
  expect(body.received).toBe(true);
});
