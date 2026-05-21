import React from 'react';

export const GoldLogo = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <img
    src="/logo.png"
    alt="Palm Promax GOLD"
    className={className}
    style={{ objectFit: 'contain', ...style }}
  />
);
