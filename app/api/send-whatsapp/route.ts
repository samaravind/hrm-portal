import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM_NUMBER!,
      to: `whatsapp:${phone}`,
    });

    return NextResponse.json({
      success: true,
      sid: response.sid,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error,
    });
  }
}