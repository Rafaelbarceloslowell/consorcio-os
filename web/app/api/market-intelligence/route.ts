import {
  NextResponse,
} from "next/server"

import {
  getMarketIntelligence,
} from "@/application/market-intelligence/get-market-intelligence"

export const dynamic =
  "force-dynamic"

export async function GET() {
  return NextResponse.json(
    await getMarketIntelligence(),
  )
}
