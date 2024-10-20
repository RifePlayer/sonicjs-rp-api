import { getRecords } from '../cms/data/data';

export async function getPrograms(ctx) {
  const fn = async function () {
    const { results } = await ctx.env.D1DATA.prepare(
      `SELECT * FROM programs order by sort;`
    ).all();

    let data = [];
    for (const freq of results) {
      data.push({
        id: freq.id,
        title: freq.title,
        description: freq.description,
        source: freq.title,
        tags: freq.tags,
        userId: freq.userId,
        createdOn: freq.createdOn,
        updatedOn: freq.updatedOn,
        frequencies: JSON.parse(freq.frequencies),
        total: freq.total
      });
    }

    return data;
  };
}

export async function checkUserExists(ctx, email) {
  const fn = async function () {
    const sql = `SELECT count(*) as count FROM users WHERE email = '${email}' COLLATE NOCASE;`;
    const { results } = await ctx.env.D1DATA.prepare(sql).all();

    return results;
  };

  const records = await getRecords(
    ctx,
    'programs',
    undefined,
    `/v2/check-user/exists${email}`,
    'd1',
    fn
  );

  return records.data[0].count > 0;
}

export async function processStripeWebhook(ctx) {
  console.log('processing new stripe webhook 7/2');
  const stipeSecret = ctx.env.STRIPE_ENDPOINT_SECRET;
  const stripeKey = ctx.env.STRIPE_KEY;
  const sig = ctx.req.header('stripe-signature');

  console.log('sig', sig);
  console.log('STRIPE_KEY', stripeKey);
  console.log('STRIPE_ENDPOINT_SECRET', stipeSecret);


  let event;

  try {
    const stripe = require('stripe')(stripeKey);

    // const json = await ctx.req.json();
    // const body = await ctx.huhreq.text()
    // const jsonBody = JSON.parse(body)

    // console.log('jsonBody', jsonBody);
    // const raw = await ctx.req.raw.body
    // const rawFull = await ctx.req.raw;
    const text = await ctx.req.text()
    // const raw = await ctx.req.parseBody();
    // const text = await ctx.req.text()

    // const bodyArrayBuffer = await ctx.req.arrayBuffer();
    // const bodyRaw = Buffer.from(new Uint8Array(bodyArrayBuffer));
    // const bodyRaw = await ctx.req.blob()

    event = await stripe.webhooks.constructEventAsync(
      text,
      sig,
      stipeSecret
    );

    console.log(event);
  } catch (err) {
    return ctx.json(`Webhook Error: ${err.message}`, 400);
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
}


function getProgramsWithJson(ctx) {}
