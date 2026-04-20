import { NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { createAdmin } from '@/lib/supabase/server';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  if (!isStripeConfigured()) return NextResponse.json({ received: true });

  const stripe = getStripe()!;
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Stripe webhook signature failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      if (session.customer) {
        await supabase.from('organizations')
          .update({ billing_status: 'active', stripe_subscription_id: session.subscription })
          .eq('stripe_customer_id', session.customer);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as any;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled';
      await supabase.from('organizations')
        .update({ billing_status: status })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      await supabase.from('organizations')
        .update({ billing_status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
