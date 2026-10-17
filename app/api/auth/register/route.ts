import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Signup is closed." }, { status: 403 })
}
