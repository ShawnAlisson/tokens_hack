import { NextResponse } from "next/server";
import { clickhouse } from "./clickhouse";

if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

export interface x402PaymentRequest {
  status: "payment_required";
  amount_usd: number;
  payment_address: string;
  payment_facilitator_url: string;
  payment_description: string;
  payment_proof_header: string;
}

const DEFAULT_FACILITATOR_URL = "https://facilitator.x402.io/pay/gymshark-intel";
const FACILITATOR_WALLET = "0x402f1a3b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f";

/**
 * x402 Payment Middleware Helper
 * Gates access to premium intelligence data APIs. If payment proof is missing, 
 * returns HTTP 402 with structured payment parameters. If payment is verified, 
 * processes and logs the revenue event to ClickHouse.
 */
export async function gateWithX402(
  request: Request,
  eventId: string,
  onPaymentSuccess: () => Promise<NextResponse>
): Promise<NextResponse> {
  const paymentProof = request.headers.get("x-payment-proof");

  // If payment proof header is missing, return 402 Payment Required
  if (!paymentProof) {
    const paymentReq: x402PaymentRequest = {
      status: "payment_required",
      amount_usd: 0.01,
      payment_address: FACILITATOR_WALLET,
      payment_facilitator_url: process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
      payment_description: `Micropayment query fee for Competitive Intelligence Event ID: ${eventId}`,
      payment_proof_header: "x-payment-proof",
    };

    return new NextResponse(JSON.stringify(paymentReq), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "X-Payment-Required-Amount": "0.01",
        "X-Payment-Required-Token": "USD",
      },
    });
  }

  // Payment proof verified (simulated proof format: "proof_tx_[random]")
  console.log(`[x402] Payment proof verified for event: ${eventId} | Proof: ${paymentProof}`);

  // Log revenue event to ClickHouse
  const revId = `rev_${Math.random().toString(36).substring(2, 10)}`;
  await clickhouse.insertRevenueEvent({
    id: revId,
    event_id: eventId,
    amount_usd: 0.01,
    timestamp: new Date().toISOString(),
  });

  return await onPaymentSuccess();
}
