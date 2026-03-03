import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { lotId, amount } = await request.json();

    if (!lotId || !amount || amount < 50) {
      return NextResponse.json({ message: "Invalid investment data" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("baselots");

    // In a real app, we would use the authenticated user's ID
    const userId = "anonymous_user"; 

    const investment = {
      lotId: new ObjectId(lotId),
      userId,
      amount,
      shares: amount / 50, // assume $50 per share
      date: new Date(),
    };

    await db.collection("investments").insertOne(investment);

    return NextResponse.json({ message: "Investment successful", investment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to process investment" }, { status: 500 });
  }
}
