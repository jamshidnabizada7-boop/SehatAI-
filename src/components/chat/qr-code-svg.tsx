'use client';

import { useMemo } from 'react';
import { generateQrMatrix } from '@/lib/qr';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeSvg({ value, size = 160, className = '' }: QrCodeSvgProps) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix || matrix.length === 0) return null;

  const matrixSize = matrix.length;
  // 2-module quiet zone padding
  const padding = 2;
  const totalGrid = matrixSize + padding * 2;

  // Build SVG path
  let path = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = c + padding;
        const y = r + padding;
        path += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${totalGrid} ${totalGrid}`}
      width={size}
      height={size}
      className={`rounded-lg bg-white p-1 shadow-sm ${className}`}
      shapeRendering="crispEdges"
      aria-label="Doctor Summary QR Code"
    >
      <rect width={totalGrid} height={totalGrid} fill="#ffffff" />
      <path d={path.trim()} fill="#0f172a" />
    </svg>
  );
}
