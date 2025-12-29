"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ url, size = 200, className = "" }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).catch((err) => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [url, size]);

  return <canvas ref={canvasRef} className={className} />;
}

