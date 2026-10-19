import { NextResponse } from "next/server"
import { verifyJwt } from "@/lib/crypto"
import { readDb } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Read session cookie
    const cookieHeader = request.headers.get("cookie") || ""
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => c.trim().split("="))
    )
    const token = cookies["gaur_session"]

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const payload = verifyJwt(token)
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Refresh user status from DB (in case admin changed status)
    const db = readDb()
    const user = db.users.find((u) => u.id === payload.id)
    if (!user) {
      return NextResponse.json({
        user: {
          id: payload.id,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          paymentStatus: payload.paymentStatus,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        paymentStatus: user.paymentStatus,
      },
    })
  } catch (error) {
    console.error("Session profile error:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
