import { useState } from 'react'

export default function BrandLogo({ className = "" }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`brand-wordmark group inline-flex items-center ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Synthetic User Generator"
    >
      {/* Transparent Vector SUG Logo (Red Logo Text) */}
      <div className="relative flex shrink-0 flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 70 38"
          className="h-[40px] w-[74px] select-none overflow-visible"
        >
          {/* Dark Teal-Green 3D Offset Shadow Text */}
          <text
            x="32.5"
            y="22.5"
            textAnchor="middle"
            fill="#2c6950"
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
              fontWeight: 900,
              fontSize: '25px',
              letterSpacing: '0.03em',
            }}
          >
            SUG
          </text>
          
          {/* Main Red Text Layer */}
          <text
            x="35"
            y="25"
            textAnchor="middle"
            fill="#ff3131"
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
              fontWeight: 900,
              fontSize: '25px',
              letterSpacing: '0.03em',
            }}
          >
            SUG
          </text>

          {/* Mint Green Underline Bar */}
          <rect
            x="17"
            y="30.5"
            width="36"
            height="4"
            rx="2"
            fill="#38d996"
            style={{
              filter: "drop-shadow(0px 0px 4px rgba(56, 217, 150, 0.5))"
            }}
          />
        </svg>
      </div>

      {/* Expanded Text (White Wordmark Revealed on Hover) */}
      <div
        className={`brand-wordmark__expanded flex flex-col justify-center whitespace-nowrap transition-all duration-350 ease-out ${
          hovered ? 'max-w-[260px] opacity-100 ml-3.5' : 'max-w-0 opacity-0 ml-0'
        } group-hover:max-w-[260px] group-hover:opacity-100 group-hover:ml-3.5`}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 leading-none">
          SYNTHETIC USER
        </span>
        <span
          className="mt-1 text-[24px] font-black leading-none text-white tracking-tight"
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}
        >
          Generator
        </span>
      </div>
    </div>
  )
}