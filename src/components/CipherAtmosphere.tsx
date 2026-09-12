import React from 'react';

export const CipherAtmosphere: React.FC = () => (
  <div className="cipher-atmosphere" aria-hidden="true">
    <svg className="cipher-art cipher-art-wheel" viewBox="0 0 320 320" fill="none">
      <circle cx="160" cy="160" r="130" />
      <circle cx="160" cy="160" r="94" />
      <circle cx="160" cy="160" r="42" />
      <path d="M160 30v36M160 254v36M30 160h36M254 160h36M68 68l26 26M226 226l26 26M252 68l-26 26M94 226l-26 26" />
      <text x="151" y="55">A</text><text x="260" y="166">X</text>
      <text x="151" y="280">R</text><text x="46" y="166">K</text>
      <path className="cipher-art-accent" d="M160 117a43 43 0 1 0 0 86 43 43 0 0 0 0-86Zm0 19a24 24 0 0 1 12 45v17h-24v-17a24 24 0 0 1 12-45Z" />
    </svg>

    <svg className="cipher-art cipher-art-key" viewBox="0 0 340 180" fill="none">
      <circle cx="78" cy="90" r="42" />
      <circle cx="78" cy="90" r="16" />
      <path d="M120 90h170M238 90v30M268 90v20M290 90v-22" />
      <path className="cipher-art-accent" d="M121 90h72" />
    </svg>

    <div className="cipher-letter-cloud">
      {['C', 'I', 'P', 'H', 'E', 'R'].map((letter, index) => (
        <span key={letter} style={{ '--letter-index': index } as React.CSSProperties}>{letter}</span>
      ))}
    </div>
  </div>
);
