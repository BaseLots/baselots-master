import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("baselots");
    const lots = await db.collection("lots").find({}).toArray();
    
    // Seed some data if empty for the MVP demo
    if (lots.length === 0) {
      const demoLots = [
        {
          name: "Modern Aspen Retreat",
          location: "Aspen, CO",
          image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80\u0026w=1000\u0026auto=format\u0026fit=crop",
          aiValuation: 245000,
          price: 210000,
          size: 2500,
          description: "High-yield luxury residential rental in a prime mountain location."
        },
        {
          name: "Urban Loft Block",
          location: "Denver, CO",
          image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80\u0026w=1000\u0026auto=format\u0026fit=crop",
          aiValuation: 412000,
          price: 385000,
          size: 1200,
          description: "Modern downtown loft with high appreciation potential."
        },
        {
          name: "Suburban Family Parcel",
          location: "Boulder, CO",
          image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80\u0026w=1000\u0026auto=format\u0026fit=crop",
          aiValuation: 189000,
          price: 175000,
          size: 4500,
          description: "Spacious single-family home optimized for consistent rental income."
        }
      ];
      await db.collection("lots").insertMany(demoLots);
      return NextResponse.json(demoLots);
    }

    return NextResponse.json(lots);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lots" }, { status: 500 });
  }
}
