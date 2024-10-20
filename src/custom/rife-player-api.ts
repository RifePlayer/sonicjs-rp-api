import { Context, Env, Hono } from 'hono';
import { getPrograms, checkUserExists } from './rife-player-data';
import { insertRecord } from '../cms/data/data';
import { sendEmail } from './send-email';
import { log } from '../cms/util/logger';
// import stripe from 'stripe';

const rifePlayerApi = new Hono();

rifePlayerApi.get('/', async (ctx) => {
  return ctx.text('Hello RifePlayer');
});

rifePlayerApi.get('/programs', async (ctx) => {
  const data = await getPrograms(ctx);
  return ctx.json(data);
});

rifePlayerApi.get('/check-user-exists/:email', async (ctx) => {
  const email = ctx.req.param('email');

  const data = await checkUserExists(ctx, email);
  return ctx.json(data);
});

// stripe handler
rifePlayerApi.post(`/stripe-rp-webhook`, async (ctx) => {

  log(ctx, {message: 'processing new stripe webhook'})
  const stipeSecret = ctx.env.STRIPE_ENDPOINT_SECRET;

  console.log('sec', stipeSecret)
  const sig = ctx.req.header('stripe-signature');

  console.log('sig', sig)

  let event;

  try {
    const stripe = require('stripe')(ctx.env.STRIPE_KEY)

    const body = await ctx.req.json();
    event = await stripe.webhooks.constructEventAsync(body, sig, stipeSecret);
    
    console.log(event);
  } catch (err) {
    return ctx.json(`Webhook Error: ${err.message}`,400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return ctx.json({ received: true });
});

rifePlayerApi.post('/contact-submit', async (ctx) => {
  console.log('contact processing ');
  const payload = await ctx.req.json();
  console.log('contact payload ', payload);

  const token = payload.token;
  console.log('contact token ', token);

  if (token !== ctx.env.APIKEY) {
    console.log('contact bad token ');
    return ctx.text('Unauthorized', 401);
  }

  payload.table = 'contacts';

  const record = await insertRecord(ctx.env.D1DATA, ctx.env.KVDATA, payload);

  console.log('contact record ', record);

  //send email confirmations
  const fullName = payload.data.lastName
    ? `${payload.data.firstName} ${payload.data.lastName}`
    : payload.data.firstName;
  const messageHtml = payload.data.message.replace(/(?:\r\n|\r|\n)/g, '<br>');
  const html = `<p>Hello ${payload.data.firstName},<p>Thanks for reaching out. We will get back to you asap.</p><p>For your reference, your message was:</p><p><hr></p><p>${fullName}:</p><p>${messageHtml}</p><p><hr></p><p>Thank you,<br>RifePlayer Support</p>`;

  if (
    ctx.env.SENDGRID_ENABLED === true ||
    ctx.env.SENDGRID_ENABLED === 'true'
  ) {
    //send to visitor
    console.log('contact send mail enabled ');
    sendEmail(
      ctx,
      payload.data.email,
      payload.data.firstName,
      ctx.env.SENDGRID_EMAIL_SENDER,
      ctx.env.SENDGRID_EMAIL_SENDER_NAME,
      payload.data.email,
      payload.data.firstName,
      'RifePlayer Message Received',
      html
    );

    //send to admin
    await sendEmail(
      ctx,
      ctx.env.SENDGRID_EMAIL_SENDER,
      ctx.env.SENDGRID_EMAIL_SENDER_NAME,
      ctx.env.SENDGRID_EMAIL_SENDER,
      ctx.env.SENDGRID_EMAIL_SENDER_NAME,
      payload.data.email,
      fullName,
      'RifePlayer Message Received',
      html
    );
  }

  console.log('contact returning ', record.data, record.code);

  return ctx.json(record.data, record.code);
});

export { rifePlayerApi };
