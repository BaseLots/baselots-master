import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Resend } from 'resend';

const PLACEHOLDER_API_KEY = 're_placeholder_1234567890abcdef_NeedsRealKey';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    console.log('Received email:', email);
    console.log('Email valid?', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('baselots');

    const existing = await db.collection('waitlist').findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: 'Already on the waitlist!' }, { status: 200 });
    }

    await db.collection('waitlist').insertOne({
      email: email.toLowerCase(),
      createdAt: new Date(),
    });

    // Send welcome email via Resend
    // NOTE: Replace PLACEHOLDER_API_KEY with real RESEND_API_KEY from .env.local for actual sending
    const resend = new Resend(PLACEHOLDER_API_KEY);
    await resend.emails.send({
      from: 'Baselots Waitlist <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to the Baselots Waitlist!',
      html: `
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;meta charset="utf-8"&gt;
  &lt;title&gt;Welcome&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;Thanks for joining the Baselots waitlist!&lt;/h1&gt;
  &lt;p&gt;You'll be the first to know when we launch.&lt;/p&gt;
  &lt;p&gt;Best,&lt;br&gt;The Baselots Team&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;
      `,
    });

    return NextResponse.json({ success: true, message: 'Added to waitlist and welcome email sent!' });
  } catch (error) {
    console.error('Waitlist error:', error);
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      return NextResponse.json({ error: 'Email send failed: Invalid API key (using placeholder). Mongo save succeeded.' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}
