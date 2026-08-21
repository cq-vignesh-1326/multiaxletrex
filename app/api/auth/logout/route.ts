import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    response.cookies.set({
      name: 'authToken',
      value: '',
      httpOnly: true,
      maxAge: 0,
    })

    response.cookies.set({
      name: 'refreshToken',
      value: '',
      httpOnly: true,
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
