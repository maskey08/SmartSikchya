import type React from "react"
import type { Metadata } from "next"
import { Lexend } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SmartSikchya - Master Your Studies",
  description:
    "Personalized learning paths for every student. Access thousands of curated lessons and quizzes tailored to your curriculum.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${lexend.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
