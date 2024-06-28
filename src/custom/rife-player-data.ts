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
    const sql = `SELECT count(*) as count FROM users WHERE email = '${email}';`;
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
  console.log('processing new stripe webhook');
  const stipeSecret = ctx.env.STRIPE_ENDPOINT_SECRET;

  console.log('sec', stipeSecret);
  const sig = ctx.req.header('stripe-signature');

  console.log('sig', sig);

  let event;

  try {
    const stripe = require('stripe')(ctx.env.STRIPE_KEY);

    const body = await ctx.req.json();
    event = await stripe.webhooks.constructEventAsync(body, sig, stipeSecret);

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

export async function changeUserSubscription(ctx, email, newPlan) {
}

function getProgramsWithJson(ctx) {}
