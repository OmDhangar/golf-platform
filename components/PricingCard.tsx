import React from 'react';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  features,
  cta,
  highlighted = false,
  onClick,
}) => {
  return (
    <div
      className="hea-card"
      style={{
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: highlighted ? '2px solid var(--green)' : '1px solid var(--border)',
        position: 'relative',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!highlighted) {
          e.currentTarget.style.borderColor = 'var(--green)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!highlighted) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {highlighted && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green)',
            color: '#000',
            padding: '4px 12px',
            borderRadius: 3,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          RECOMMENDED
        </div>
      )}

      <div>
        <h3
          className="label-caps"
          style={{ color: 'var(--text-primary)', marginBottom: 12 }}
        >
          {name}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span
            className="font-barlow"
            style={{
              fontWeight: 800,
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            {period}
          </span>
        </div>
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((feature) => (
          <li
            key={feature}
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--green)' }}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        className="btn-primary"
        style={{
          width: '100%',
          marginTop: 'auto',
          cursor: 'pointer',
          background: highlighted ? 'var(--green)' : 'var(--green)',
        }}
        onClick={onClick || (() => (window.location.href = '/signup'))}
      >
        {cta}
      </button>
    </div>
  );
};
