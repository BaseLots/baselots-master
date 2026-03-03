const BASE_URL = "https://usesend-a0sksccgw4s04wwwgco4sc0o.server.tokn.deal/api/v1"

interface AddContactParams {
  email: string
  firstName?: string
  lastName?: string
}

function getHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }
}

export async function addContactToBook({
  email,
  firstName,
  lastName,
}: AddContactParams) {
  const apiKey = process.env.USESEND_API_KEY
  const contactBookId = process.env.USESEND_CONTACT_BOOK_ID

  if (!apiKey || !contactBookId) {
    throw new Error("Missing useSend configuration (API Key or Contact Book ID)")
  }

  const response = await fetch(
    `${BASE_URL}/contactBooks/${contactBookId}/contacts`,
    {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        subscribed: true,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error("useSend addContact error:", error)
    throw new Error(error.message || "Failed to add contact to useSend")
  }

  return await response.json()
}

export async function deleteContactByEmail(email: string) {
  const apiKey = process.env.USESEND_API_KEY
  const contactBookId = process.env.USESEND_CONTACT_BOOK_ID

  if (!apiKey || !contactBookId) {
    throw new Error("Missing useSend configuration (API Key or Contact Book ID)")
  }

  // 1. Find the contact by email
  const searchResponse = await fetch(
    `${BASE_URL}/contactBooks/${contactBookId}/contacts?emails=${encodeURIComponent(
      email
    )}`,
    {
      method: "GET",
      headers: getHeaders(apiKey),
    }
  )

  if (!searchResponse.ok) {
    const error = await searchResponse.json()
    console.error("useSend searchContact error:", error)
    throw new Error(error.message || "Failed to find contact in useSend")
  }

  const contacts = await searchResponse.json()

  if (!contacts || contacts.length === 0) {
    throw new Error("Contact not found")
  }

  const contactId = contacts[0].id

  // 2. Delete the contact
  const deleteResponse = await fetch(
    `${BASE_URL}/contactBooks/${contactBookId}/contacts/${contactId}`,
    {
      method: "DELETE",
      headers: getHeaders(apiKey),
    }
  )

  if (!deleteResponse.ok) {
    const error = await deleteResponse.json()
    console.error("useSend deleteContact error:", error)
    throw new Error(error.message || "Failed to delete contact from useSend")
  }

  return await deleteResponse.json()
}

export async function sendWelcomeEmail({ to }: { to: string }) {
  const apiKey = process.env.USESEND_API_KEY
  const fromEmail = process.env.USESEND_FROM_EMAIL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://baselots.com"

  if (!apiKey || !fromEmail) {
    throw new Error("Missing useSend configuration (API Key or From Email)")
  }

  const response = await fetch(`${BASE_URL}/emails`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      to,
      from: `BaseLots <${fromEmail}>`,
      subject: "Welcome to the Future of Real Estate",
      text: `Welcome to Baselots! Thank you for joining our early access list. We're on a mission to democratize real estate through compliant, on-chain fractional ownership. You'll be the first to know when our first lot opens for investment.\n\nUnsubscribe: ${baseUrl}/unsubscribe`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to Baselots</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining our early access list. We're thrilled to have you with us from the beginning.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            At <strong>Baselots</strong>, we're building the foundation for accessible, compliant real-world asset ownership. Our mission is to democratize real estate through fractionalized, on-chain investment opportunities.
          </p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">What's next?</p>
            <p style="font-size: 14px; line-height: 1.5; color: #666; margin: 0;">
              You'll be the first to receive updates on our progress and be notified the moment our first lot opens for investment.
            </p>
          </div>
          <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="margin: 0 0 10px 0;">
              <a href="${baseUrl}/unsubscribe" style="font-size: 12px; color: #999; text-decoration: underline;">Unsubscribe</a>
            </p>
            <p style="font-size: 14px; color: #999; margin: 0;">
              © 2026 BaseLots
            </p>
          </div>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("useSend sendEmail error:", error)
    throw new Error(error.message || "Failed to send welcome email via useSend")
  }

  return await response.json()
}

