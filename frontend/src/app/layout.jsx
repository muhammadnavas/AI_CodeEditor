import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Fix font loading
  fallback: ['system-ui', 'arial'] // Fallback fonts
})

export const metadata = {
  title: 'AI Code Editor - Technical Interview Platform',
  description: 'AI-powered code editor for technical interviews with OpenAI integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  )
}