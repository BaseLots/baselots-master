import { NextRequest, NextResponse } from "next/server";
import { addContactToBook, sendWelcomeEmail } from "@/lib/usesend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // 1. Add contact to useSend contact book
    await addContactToBook({ email });

    // 2. Send welcome email
    await sendWelcomeEmail({ to: email });

    return NextResponse.json(
      { success: true, message: "Email saved and welcome email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save email" },
      { status: 500 }
    );
  }
}
