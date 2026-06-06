import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

type Payload = {
  fullName?: string
  email?: string
  password?: string
  baseUrl?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getAppUrl(baseUrl?: string, req?: NextRequest) {
  if (baseUrl) {
    return baseUrl.replace(/\/$/, '')
  }

  const origin = req?.headers.get('origin')?.trim()
  if (origin) {
    return origin.replace(/\/$/, '')
  }

  const referer = req?.headers.get('referer')?.trim()
  if (referer) {
    try {
      return new URL(referer).origin.replace(/\/$/, '')
    } catch {
      // Ignore invalid referer values and fall back to env vars.
    }
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    process.env.APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  )
}

function buildWelcomeEmailHtml(fullName: string, email: string, loginUrl: string, password?: string) {
  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(email)
  const safeLoginUrl = escapeHtml(loginUrl)
  const safePassword = password ? escapeHtml(password) : null
  return `
    <div style="margin:0; padding:0; background:#f4f6fb;">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
        ${safeName}'s employee joining has been confirmed.
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6fb; margin:0; padding:0; width:100%;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; width:100%; margin:0 auto;">
              <tr>
                <td align="center" style="padding-bottom:18px;">
                  <div style="display:inline-flex; align-items:center; gap:10px; font-family:Arial,Helvetica,sans-serif;">
                    <div style="width:44px; height:44px; border-radius:14px; background:linear-gradient(135deg, #111827 0%, #374151 100%); color:#ffffff; font-weight:700; font-size:16px; line-height:44px; text-align:center; letter-spacing:0.08em;">
                      SM
                    </div>
                    <div style="text-align:left;">
                      <div style="font-size:12px; font-weight:700; letter-spacing:0.18em; color:#6b7280; text-transform:uppercase;">Welcome</div>
                      <div style="font-size:18px; font-weight:700; color:#111827; line-height:1.1;">SAM MARKET</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff; border-radius:24px; box-shadow:0 12px 30px rgba(17,24,39,0.08); overflow:hidden;">
                  <div style="height:8px; background:linear-gradient(90deg, #111827 0%, #4f46e5 45%, #22c55e 100%);"></div>
                  <div style="padding:40px 36px 32px; font-family:Arial,Helvetica,sans-serif; color:#111827;">
                    <div style="display:inline-block; border-radius:999px; padding:8px 14px; background:#eef2ff; color:#4338ca; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                      Employee joining confirmed
                    </div>
                    <h1 style="margin:18px 0 14px; font-size:28px; line-height:1.2; letter-spacing:-0.03em; color:#111827;">
                      Welcome aboard, ${safeName},
                    </h1>
                    <p style="margin:0 0 18px; font-size:16px; line-height:1.7; color:#374151;">
                      Your joining with SAM MARKET has been confirmed. We're excited to have you on the team.
                    </p>
                    <div style="margin:22px 0 28px; padding:22px; border:1px solid #e5e7eb; border-radius:18px; background:linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);">
                      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#6b7280;">
                        Use the button below to join now and get started.
                      </p>
                      <p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#6b7280;"><strong>Login Email:</strong> ${safeEmail}</p>
                      ${safePassword ? `<p style="margin:0 0 10px; font-size:14px; line-height:1.6; color:#6b7280;"><strong>Temporary Password:</strong> ${safePassword}</p>` : ''}
                      ${safePassword ? `<p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">You can update your password later from your account settings when that option is available.</p>` : ''}
                      <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">
                        If you need help accessing your account, reply to this email and our team will assist you.
                      </p>
                    </div>
                    <div style="text-align:center; margin:0 0 28px;">
                      <a
                        href="${safeLoginUrl}"
                        style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:14px 26px; border-radius:14px; box-shadow:0 10px 22px rgba(17,24,39,0.15);"
                      >
                        Join Now
                      </a>
                    </div>
                    <p style="margin:0; font-size:13px; line-height:1.7; color:#6b7280;">
                      If the button does not work, copy and paste this URL into your browser:
                      <br />
                      <a href="${safeLoginUrl}" style="color:#4f46e5; word-break:break-all; text-decoration:none;">${safeLoginUrl}</a>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 12px 0; font-family:Arial,Helvetica,sans-serif; color:#9ca3af; font-size:12px; line-height:1.6;">
                  You received this message because your employee account was created in SAM MARKET.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload
    const email = body.email?.trim()
    const fullName = body.fullName?.trim() || 'there'
    const password = body.password?.trim() || undefined
    const loginUrl = `${getAppUrl(body.baseUrl, req)}/sign-in`

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        {
          error:
            'Email sending is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL to .env.local.',
        },
        { status: 500 },
      )
    }

    const resend = new Resend(apiKey)
    const subject = 'Welcome to SAM MARKET'
    const text = [
      `Hello ${fullName},`,
      '',
      'Your joining with SAM MARKET has been confirmed.',
      `Login Email: ${email}`,
      ...(password ? [`Temporary Password: ${password}`] : []),
      ...(password ? ['You can update your password later from your account settings when that option is available.'] : []),
      `Join here: ${loginUrl}`,
      '',
      'If you need help, reply to this email and our team will assist you.',
    ].join('\n')

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject,
      text,
      html: buildWelcomeEmailHtml(fullName, email, loginUrl, password),
    })

    let emailSent = true
    const emailId: string | null = emailResult.data?.id ?? null

    if (emailResult.error) {
      emailSent = false
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          ok: false,
          emailSent: false,
          error: emailResult.error?.message ?? 'Failed to send email.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      emailId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
