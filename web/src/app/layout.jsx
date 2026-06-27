import './globals.css'

export const metadata = {
  title: 'Rapor Sistemi',
  description: 'Gelişmiş GA4 & Meta Dijital Performans Raporlama Sistemi',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
