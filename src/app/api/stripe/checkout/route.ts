import { NextResponse } from 'next/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured', url: null }, { status: 200 });
  }

  const stripe = getStripe()!;
  const { priceId } = await request.json();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('org_id, organizations(stripe_customer_id)').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 400 });

    const org = profile.organizations as any;
    let customerId = org?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email || '', metadata: { org_id: profile.org_id } });
      customerId = customer.id;
      await supabase.from('organizations').update({ stripe_customer_id: customerId }).eq('id', profile.org_id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin?billing=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
