import { Hono } from 'hono';
import { processStripeWebhook } from './rife-player-data';
import { env } from 'hono/adapter'
import Stripe from 'stripe'

const stripeApi = new Hono();

stripeApi.post(`/stripe-rp-webhook`, async (ctx) => {
  return await processStripeWebhook(ctx);
});

stripeApi.get(`/stripe-rp-webhook`, (ctx) => {
  return ctx.json({ received: true });
});


stripeApi.post('/stripe-rp-webhook2', async (context) => {
  const { STRIPE_SECRET_API_KEY, STRIPE_WEBHOOK_SECRET } =
    env(context)
  const stripe = new Stripe(STRIPE_SECRET_API_KEY)
  const signature = context.req.header('stripe-signature')

  console.log('STRIPE_SECRET_API_KEY', STRIPE_SECRET_API_KEY)
  console.log('STRIPE_WEBHOOK_SECRET', STRIPE_WEBHOOK_SECRET)
  console.log('signature', signature)

  try {
    if (!signature) {
      return context.text('', 400)
    }
    const body = await context.req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    )
    switch (event.type) {
      case 'payment_intent.created': {
        console.log(event.data.object)
        break
      }
      default:
        break
    }
    return context.text('', 200)
  } catch (err) {
    const errorMessage = `⚠️  Webhook signature verification failed. ${
      err instanceof Error ? err.message : 'Internal server error'
    }`
    console.log(errorMessage)
    return context.text(errorMessage, 400)
  }
})

export { stripeApi };
