"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import clientPromise from "@/lib/mongodb"
import type { ActionResponse } from "@/types/actions"
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const signupAction = actionClient
  .schema(signupSchema)
  .action(async ({ parsedInput: { email } }): Promise<ActionResponse> => {
    try {
      const client = await clientPromise;
      const db = client.db("baselots");
      const waitlist = db.collection("waitlist");

      // Check if already exists
      const existing = await waitlist.findOne({ email: email.toLowerCase() });
      if (existing) {
        return {
          success: true,
          data: { message: "You're already on the list!" },
        }
      }

      // Add to waitlist
      await waitlist.insertOne({
        email: email.toLowerCase(),
        signupDate: new Date(),
      });

      // Send Welcome Email
      try {
        await resend.emails.send({
          from: 'BaseLots <no-reply@baselots.com>',
          to: email.toLowerCase(),
          subject: '⚡ Welcome to BaseLots Early Access',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0F172A; background-color: #ffffff;">
              <h1 style="font-size: 28px; font-weight: 800; color: #FF5722; margin-bottom: 24px; letter-spacing: -0.02em;">Welcome to the Future.</h1>
              
              <p style="font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
                Hi there,
              </p>
              
              <p style="font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
                Thank you for joining the <strong>BaseLots</strong> early access list! We've successfully captured your email.
              </p>

              <p style="font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
                You're now officially in line to be among the first to explore our fractional residential portfolio when we go live.
              </p>

              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 32px; border-radius: 24px; margin-bottom: 32px;">
                <h3 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; margin-top: 0; margin-bottom: 12px;">What's Next?</h3>
                <p style="font-size: 16px; line-height: 1.6; margin: 0; color: #334155;">
                  We are currently finalizing the technical foundation to ensure a compliant, seamless experience for fractional ownership. You'll receive an update from us as soon as the first property lot is ready for investment.
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #64748B; margin-bottom: 40px;">
                Welcome to the foundation of accessible real estate.
              </p>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 32px;">
                <p style="font-size: 16px; font-weight: 700; margin: 0; color: #0F172A;">Jax ⚡</p>
                <p style="font-size: 14px; margin: 4px 0 0 0; color: #64748B;">COO, BaseLots</p>
                <p style="font-size: 14px; margin: 4px 0 0 0;"><a href="https://baselots.com" style="color: #00D4FF; text-decoration: none; font-weight: 600;">baselots.com</a></p>
              </div>

              <div style="margin-top: 48px; text-align: center;">
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">
                  © 2026 BaseLots. All rights reserved.
                </p>
                <p style="font-size: 12px; color: #CBD5E1; margin: 8px 0 0 0;">
                  If you didn't sign up for this, you can safely <a href="https://baselots.com/unsubscribe" style="color: #CBD5E1; text-decoration: underline;">unsubscribe</a>.
                </p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        // Log error but don't fail the signup
        console.error("Email sending failed:", emailError);
      }

      return {
        success: true,
        data: { message: "Successfully signed up" },
      }
    } catch (error) {
      console.error("Signup action error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign up",
      }
    }
  })
