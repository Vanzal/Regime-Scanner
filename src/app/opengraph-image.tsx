import { ImageResponse } from 'next/og'
import { OG_IMAGE_ALT, OG_IMAGE_SIZE, SITE_TITLE } from '@/lib/seo'

export const alt = OG_IMAGE_ALT
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

/** 1200×630 Open Graph image. Dark navy + emerald, matching the marketing site. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f1c2e',
          color: '#f4f7fb',
          padding: '72px 80px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#5ee0b0',
          }}
        >
          NexusScope
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1.12,
              fontWeight: 650,
              letterSpacing: '-0.03em',
            }}
          >
            DACH regulatory readiness intelligence
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.4, color: '#b7c3d4', maxWidth: 880 }}>
            Map your organisation against NIS2UmsuCG, NISG 2024 and ISG — Germany, Austria and
            Switzerland.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            color: '#8fa0b5',
          }}
        >
          <span>nexusscopes.com</span>
          <span>{SITE_TITLE.split('—')[0]?.trim()}</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
