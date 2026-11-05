"use client";

import React from "react";

interface ZelLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function ZelLogo({
  size = 40,
  animated = true,
  className = "",
}: ZelLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Subtle outer glow */}
      <div
        className={`absolute inset-0 rounded-xl opacity-45 blur-md transition-all duration-500 ${
          animated ? "group-hover:opacity-80" : ""
        }`}
        style={{
          background:
            "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-md"
      >
        <defs>
          <linearGradient
            id="signZelMainGrad"
            x1="4"
            y1="4"
            x2="60"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
          <linearGradient
            id="signZelBladeGrad"
            x1="14"
            y1="14"
            x2="50"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="45%" stopColor="var(--accent-secondary)" />
            <stop offset="100%" stopColor="var(--accent-primary)" />
          </linearGradient>
        </defs>

        {/* Squircle Obsidian Shield */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="15"
          fill="#0B0F17"
          stroke="url(#signZelMainGrad)"
          strokeWidth="2.5"
        />

        {/* Inner Geometric Tech Grid Accents */}
        <path
          d="M12 10H52M12 54H52"
          stroke="url(#signZelMainGrad)"
          strokeOpacity="0.25"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Dashing "Z" Split-Ribbon Monogram */}
        {/* Top horizontal bar + diagonal slash */}
        <path
          d="M15 16H49L45 24H27.5L49 24L25.5 44H49L45 50H15L19 42H36.5L15 42L38.5 22H15L15 16Z"
          fill="url(#signZelMainGrad)"
        />

        {/* High-contrast inner lightning Z blade */}
        <path
          d="M17 16H49L24 41H49L45 48H15L40 23H15L17 16Z"
          fill="url(#signZelBladeGrad)"
        />

        {/* Emerald Verified Node Dot */}
        <circle cx="51" cy="13" r="3" fill="#10B981" />
      </svg>
    </div>
  );
}
