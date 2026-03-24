declare module 'qrcode.react' {
  import React from 'react';

  interface QRCodeProps {
    value: string;
    size?: number;
    level?: string;
    includeMargin?: boolean;
    renderAs?: 'canvas' | 'svg';
    fgColor?: string;
    bgColor?: string;
  }

  const QRCode: React.FC<QRCodeProps>;
  export default QRCode;
}
