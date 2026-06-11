import { NextRequest, NextResponse } from 'next/server'

type Payload = {
  fullName?: string
  email?: string
  leaveType?: string
  startDate?: string
  endDate?: string
  durationLabel?: string
  reason?: string
  status?: 'approved' | 'rejected'
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

function buildLeaveStatusEmailHtml(args: Required<Pick<Payload, 'fullName' | 'email' | 'leaveType' | 'startDate' | 'endDate' | 'durationLabel' | 'reason' | 'status'>> & { baseUrl: string }) {
  const safeName = escapeHtml(args.fullName)
  const safeEmail = escapeHtml(args.email)
  const safeLeaveType = escapeHtml(args.leaveType)
  const safeStartDate = escapeHtml(args.startDate)
  const safeEndDate = escapeHtml(args.endDate)
  const safeDurationLabel = escapeHtml(args.durationLabel)
  const safeReason = escapeHtml(args.reason)
  const safeStatus = escapeHtml(args.status === 'approved' ? 'Approved' : 'Declined')
  const safeDashboardUrl = escapeHtml(`${args.baseUrl}/leave`)
  const statusColor = args.status === 'approved' ? '#059669' : '#dc2626'
  const statusBackground = args.status === 'approved' ? '#ecfdf5' : '#fef2f2'
  const accent = args.status === 'approved' ? '#10b981' : '#ef4444'

  return `
    <div style="margin:0;padding:0;background:#f4f6fb;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6fb;margin:0;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;width:100%;margin:0 auto;">
              <tr>
                <td style="background:#ffffff;border-radius:24px;box-shadow:0 12px 30px rgba(17,24,39,0.08);overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
                  <div style="height:8px;background:linear-gradient(90deg,#111827 0%,${accent} 100%);"></div>
                  <div style="padding:40px 36px 32px;color:#111827;">
                    <div style="display:inline-block;border-radius:999px;padding:8px 14px;background:${statusBackground};color:${statusColor};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      Request ${safeStatus}
                    </div>
                    <h1 style="margin:18px 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;color:#111827;">
                      Hi ${safeName},
                    </h1>
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#374151;">
                      Your request has been ${escapeHtml(args.status)}. Here are the updated details:
                    </p>
                    <div style="margin:22px 0 28px;padding:22px;border:1px solid #e5e7eb;border-radius:18px;background:linear-gradient(180deg,#ffffff 0%,#f9fafb 100%);">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#374151;">
                        <tr><td><strong>Employee Email:</strong> ${safeEmail}</td></tr>
                        <tr><td><strong>Type:</strong> ${safeLeaveType}</td></tr>
                        <tr><td><strong>Date Range:</strong> ${safeStartDate} to ${safeEndDate}</td></tr>
                        <tr><td><strong>Duration:</strong> ${safeDurationLabel}</td></tr>
                        <tr><td><strong>Reason:</strong> ${safeReason}</td></tr>
                        <tr><td><strong>Status:</strong> ${safeStatus}</td></tr>
                      </table>
                    </div>
                    <div style="text-align:center;margin:0 0 28px;">
                      <a href="${safeDashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:14px;box-shadow:0 10px 22px rgba(17,24,39,0.15);">
                        View dashboard
                      </a>
                    </div>
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                      If the button does not work, copy and paste this URL into your browser:
                      <br />
                      <a href="${safeDashboardUrl}" style="color:#4f46e5;word-break:break-all;text-decoration:none;">${safeDashboardUrl}</a>
                    </p>
                  </div>
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
    const leaveType = body.leaveType?.trim()
    const startDate = body.startDate?.trim()
    const endDate = body.endDate?.trim()
    const durationLabel = body.durationLabel?.trim()
    const reason = body.reason?.trim()
    const status = body.status
    const baseUrl = getAppUrl(body.baseUrl, req)

    if (!email || !leaveType || !startDate || !endDate || !durationLabel || !reason || !status) {
      return NextResponse.json(
        { error: 'Email, leave details, and status are required.' },
        { status: 400 },
      )
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

    const subject = status === 'approved'
      ? 'Your request has been approved'
      : 'Your request has been declined'

    const text = [
      `Hi ${fullName},`,
      '',
      `Your request has been ${status}.`,
      `Employee Email: ${email}`,
      `Type: ${leaveType}`,
      `Date Range: ${startDate} to ${endDate}`,
      `Duration: ${durationLabel}`,
      `Reason: ${reason}`,
      `Status: ${status === 'approved' ? 'Approved' : 'Declined'}`,
      '',
      `View dashboard: ${baseUrl}/leave`,
    ].join('\n')

    const emailResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        text,
        html: buildLeaveStatusEmailHtml({
          fullName,
          email,
          leaveType,
          startDate,
          endDate,
          durationLabel,
          reason,
          status,
          baseUrl,
        }),
      }),
    })

    const emailJson = await emailResult.json().catch(() => null)
    const emailId: string | null = emailJson?.id ?? null

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          emailSent: false,
          error: emailJson?.message ?? emailJson?.error ?? 'Failed to send email.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      emailSent: true,
      emailId,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
