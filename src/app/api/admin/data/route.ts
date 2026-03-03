import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('pw');
  const adminPw = process.env.ADMIN_PASSWORD || "BaseLotsAdmin2026!";

  if (password !== adminPw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("baselots");
    
    const waitlist = await db.collection("waitlist").find({}).sort({ createdAt: -1 }).toArray();
    const investments = await db.collection("investments").find({}).sort({ date: -1 }).toArray();
    
    return NextResponse.json({
      waitlist,
      investments,
      stats: {
        totalLeads: waitlist.length,
        totalInvested: investments.reduce((acc, inv) => acc + (inv.amount || 0), 0)
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}
