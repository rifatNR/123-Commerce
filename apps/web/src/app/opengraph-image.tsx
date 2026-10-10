import { ImageResponse } from 'next/og'

// Default social share image (1200x630) until a real logo/banner exists.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = '123Commerce'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e60023, #a0031c)',
        color: 'white',
        fontSize: 96,
        fontWeight: 800,
      }}
    >
      <div style={{ display: 'flex' }}>123Commerce</div>
      <div style={{ display: 'flex', fontSize: 40, fontWeight: 500, marginTop: 24, opacity: 0.9 }}>
        Cash on delivery all over Bangladesh
      </div>
    </div>,
    size,
  )
}
