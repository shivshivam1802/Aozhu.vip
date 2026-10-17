import { NextResponse } from "next/server"
import { readDb } from "@/lib/db"
import { verifyPassword, signJwt } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    const submittedEmail = String(email).trim()
    const submittedPassword = String(password)

    if (!submittedEmail || !submittedPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const studioEmail = (process.env["DEMO_EMAIL"] || "").trim()
    const studioPassword = (process.env["DEMO_PASSWORD"] || "").trim()
    const studioName = (process.env["DEMO_NAME"] || "AOZHU").trim()

    if (
      studioEmail &&
      studioPassword &&
      submittedEmail.toLowerCase() === studioEmail.toLowerCase() &&
      submittedPassword === studioPassword
    ) {
      const payload = {
        id: "demo-user",
        email: studioEmail,
        fullName: studioName,
        role: "admin" as const,
        paymentStatus: "verified" as const,
      }
      const token = signJwt(payload)
      const response = NextResponse.json({ success: true, user: payload })
      response.cookies.set("gaur_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      })
      return response
    }

    const db = readDb()
    const user = db.users.find((u) => u.email.toLowerCase() === submittedEmail.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify Password
    const isValid = verifyPassword(submittedPassword, user.passwordHash, user.passwordSalt)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Handle user states (only for users, admins bypass status checks)
    if (user.role === "user") {
      if (user.paymentStatus === "rejected") {
        return NextResponse.json(
          {
            error: "Payment verification failed. Please contact support or submit a new transaction.",
            status: "rejected",
          },
          { status: 403 }
        )
      }
    }

    // Create Session payload
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      paymentStatus: user.paymentStatus,
    }

    // Sign Token
    const token = signJwt(payload)

    const response = NextResponse.json({
      success: true,
      user: payload,
    })

    // Set Secure HTTP-only Cookie
    response.cookies.set("gaur_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
