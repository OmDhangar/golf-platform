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
      className="hea-card pricing-card animate-scale-in"
      style={{
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: highlighted ? '2px solid var(--green)' : '1px solid var(--border)',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--green)';
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(34, 197, 94, 0.15)';
      }}
      onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = highlighted ? 'var(--green)' : 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
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
            className="font-barlow price-value"
            style={{
              fontWeight: 800,
              fontSize: '1.8rem',
              color: 'var(--text-primary)',
              transition: 'font-size 0.3s ease',
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

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((feature) => (
          <li
            key={feature}
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 6,
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
