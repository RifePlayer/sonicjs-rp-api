import { Hono } from 'hono';
import { processStripeWebhook } from './rife-player-data';

const stripeApi = new Hono();

stripeApi.post(`/stripe-rp-webhook`, async (ctx) => {
  return await processStripeWebhook(ctx);
});

export { stripeApi };
