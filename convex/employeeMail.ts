"use node"

import { action, internalAction } from "./_generated/server"
import { v } from "convex/values"
import { Resend } from "resend"

type ResendEmailArgs = {
  email: string
  subject: string
  text: string
  html: string
}

type WelcomeMessageArgs = {
  fullName: string
  email: string
  employeeId: string
  joiningDate: string
  department: string
  position: string
  password?: string
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

function getLoginUrl() {
  return `${getAppUrl()}/sign-in`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function companyBrandBlock() {
  return `
    <div style="display:flex;align-items:center;gap:12px;font-family:Arial,Helvetica,sans-serif;">
      <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#111827 0%,#374151 100%);color:#ffffff;font-weight:700;font-size:16px;line-height:44px;text-align:center;letter-spacing:0.08em;">SM</div>
      <div style="text-align:left;">
        <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;color:#6b7280;text-transform:uppercase;">Welcome</div>
        <div style="font-size:18px;font-weight:700;color:#111827;line-height:1.1;">SAM MARKET</div>
      </div>
    </div>
  `
}

function buildLoginDetails(args: WelcomeMessageArgs) {
  const lines = [
    `Login Email: ${args.email}`,
    `Sign-in URL: ${getLoginUrl()}`,
  ]

  if (args.password) {
    lines.push(`Temporary Password: ${args.password}`)
    lines.push(`Password updates: Use the password change option in your account settings when it is available.`)
  }

  return lines
}

function buildWelcomeText(args: WelcomeMessageArgs) {
  return [
    `Hello ${args.fullName},`,
    "",
    "Welcome aboard! Your SAM MARKET employee account is ready.",
    `Employee ID: ${args.employeeId}`,
    `Department: ${args.department || "N/A"}`,
    `Position: ${args.position || "N/A"}`,
    `Joining Date: ${args.joiningDate}`,
    ...buildLoginDetails(args),
    "",
    "Please sign in using the link above and contact the team if you need help getting started.",
  ].join("\n")
}

function buildWelcomeHtml(args: WelcomeMessageArgs) {
  const safeName = escapeHtml(args.fullName)
  const safeEmployeeId = escapeHtml(args.employeeId)
  const safeDepartment = escapeHtml(args.department || "N/A")
  const safePosition = escapeHtml(args.position || "N/A")
  const safeJoiningDate = escapeHtml(args.joiningDate)
  const safeLoginUrl = escapeHtml(getLoginUrl())
  const safeEmail = escapeHtml(args.email)
  const safePassword = args.password ? escapeHtml(args.password) : null

  return `
    <div style="margin:0;padding:0;background:#f4f6fb;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${safeName}'s employee account is ready with SAM MARKET.
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6fb;margin:0;padding:0;width:100%;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;width:100%;margin:0 auto;">
              <tr>
                <td align="center" style="padding-bottom:18px;">
                  ${companyBrandBlock()}
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border-radius:24px;box-shadow:0 12px 30px rgba(17,24,39,0.08);overflow:hidden;">
                  <div style="height:8px;background:linear-gradient(90deg,#111827 0%,#4f46e5 45%,#22c55e 100%);"></div>
                  <div style="padding:40px 36px 32px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                    <div style="display:inline-block;border-radius:999px;padding:8px 14px;background:#eef2ff;color:#4338ca;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      Employee account created
                    </div>
                    <h1 style="margin:18px 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;color:#111827;">
                      Welcome aboard, ${safeName},
                    </h1>
                    <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#374151;">
                      Your SAM MARKET employee account has been created successfully. Below are your onboarding and login details.
                    </p>
                    <div style="margin:22px 0 28px;padding:22px;border:1px solid #e5e7eb;border-radius:18px;background:linear-gradient(180deg,#ffffff 0%,#f9fafb 100%);">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#374151;">
                        <tr><td><strong>Employee ID:</strong> ${safeEmployeeId}</td></tr>
                        <tr><td><strong>Department:</strong> ${safeDepartment}</td></tr>
                        <tr><td><strong>Position:</strong> ${safePosition}</td></tr>
                        <tr><td><strong>Joining Date:</strong> ${safeJoiningDate}</td></tr>
                        <tr><td><strong>Login Email:</strong> ${safeEmail}</td></tr>
                        ${safePassword ? `<tr><td><strong>Temporary Password:</strong> ${safePassword}</td></tr>` : ""}
                      </table>
                    </div>
                    <div style="text-align:center;margin:0 0 28px;">
                      <a href="${safeLoginUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:14px;box-shadow:0 10px 22px rgba(17,24,39,0.15);">
                        Sign In Now
                      </a>
                    </div>
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                      If the button does not work, copy and paste this URL into your browser:
                      <br />
                      <a href="${safeLoginUrl}" style="color:#4f46e5;word-break:break-all;text-decoration:none;">${safeLoginUrl}</a>
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 12px 0;font-family:Arial,Helvetica,sans-serif;color:#9ca3af;font-size:12px;line-height:1.6;">
                  You received this message because a SAM MARKET employee account was created for you.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `
}

async function sendResendEmail(args: ResendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    console.warn("Skipping welcome email because RESEND_API_KEY or RESEND_FROM_EMAIL is missing.")
    return { sent: false, skipped: true }
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [args.email],
    subject: args.subject,
    text: args.text,
    html: args.html,
  })

  if (error) {
    throw new Error(error.message ?? "Resend request failed.")
  }

  return { sent: true, messageId: data?.id ?? null }
}

export const sendWelcomeEmail = internalAction({
  args: {
    fullName: v.string(),
    email: v.string(),
    employeeId: v.string(),
    joiningDate: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return await sendResendEmail({
      email: args.email,
      subject: `Welcome to the team, ${args.fullName}`,
      text: [
        `Hi ${args.fullName},`,
        "",
        "Welcome aboard! Your employee record has been created successfully.",
        `Employee ID: ${args.employeeId}`,
        `Login Email: ${args.email}`,
        `Joining Date: ${args.joiningDate}`,
        ...(args.password ? [`Temporary Password: ${args.password}`] : []),
        args.password
          ? "You can update your password later from your account settings when that option is available."
          : "A password will be shared separately if required.",
        "",
        "We're excited to have you with us.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">Welcome to the team, ${args.fullName}</h2>
          <p>Hi ${args.fullName},</p>
          <p>Your employee record has been created successfully. Here are your onboarding details:</p>
          <ul>
            <li><strong>Employee ID:</strong> ${args.employeeId}</li>
            <li><strong>Login Email:</strong> ${args.email}</li>
            <li><strong>Joining Date:</strong> ${args.joiningDate}</li>
            ${args.password ? `<li><strong>Temporary Password:</strong> ${escapeHtml(args.password)}</li>` : ''}
          </ul>
          <p>You can update your password later from your account settings when that option is available.</p>
          <p>We're excited to have you with us.</p>
        </div>
      `,
    })
  },
})

export const sendEmployeeOnboarding = internalAction({
  args: {
    fullName: v.string(),
    email: v.string(),
    employeeId: v.string(),
    joiningDate: v.string(),
    department: v.string(),
    position: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const loginUrl = getLoginUrl()
    const emailResult = await sendResendEmail({
      email: args.email,
      subject: `Welcome to SAM MARKET, ${args.fullName}`,
      text: buildWelcomeText(args),
      html: buildWelcomeHtml(args),
    })

    const warnings: string[] = []
    if (!emailResult.sent) {
      warnings.push("Email was skipped because email service is not configured.")
    }

    return {
      ok: true,
      loginUrl,
      emailSent: Boolean(emailResult.sent),
      warnings: warnings.length ? warnings : undefined,
    }
  },
})

export const sendEmployeeEmail = action({
  args: {
    fullName: v.union(v.string(), v.null()),
    email: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const passwordLine = args.password ? `Temporary Password: ${args.password}` : null
    return await sendResendEmail({
      email: args.email,
      subject: `Welcome to SAM MARKET`,
      text: [
        `Hi ${args.fullName || "there"},`,
        "",
        "Your employee account has been created successfully.",
        `Login Email: ${args.email}`,
        ...(passwordLine ? [passwordLine] : []),
        "You can update your password later from your account settings when that option is available.",
        "",
        "If this was unexpected, you can ignore it.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">Welcome to SAM MARKET</h2>
          <p>Hi ${args.fullName || "there"},</p>
          <p>Your employee account has been created successfully.</p>
          <ul>
            <li><strong>Login Email:</strong> ${args.email}</li>
            ${passwordLine ? `<li><strong>Temporary Password:</strong> ${escapeHtml(args.password ?? "")}</li>` : ""}
          </ul>
          <p>You can update your password later from your account settings when that option is available.</p>
          <p>If this was unexpected, you can ignore it.</p>
        </div>
      `,
    })
  },
})
