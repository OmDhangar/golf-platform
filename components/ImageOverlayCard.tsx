import React from 'react';

interface ImageOverlayCardProps {
  step: string;
  title: string;
  description: string;
  backgroundImage: string;
  className?: string;
}

export const ImageOverlayCard: React.FC<ImageOverlayCardProps> = ({
  step,
  title,
  description,
  backgroundImage,
  className = '',
}) => {
  return (
    <div
      className={`hea-card ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '300px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--green)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)',
          zIndex: 1,
        }}
      />
      
      {/* Dark Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(8, 15, 26, 0.6), rgba(8, 15, 26, 0.9))',
          zIndex: 2,
        }}
      />
      
      {/* Content */}
      <div
        style={{
          position: 'relative',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: '3rem',
            color: 'var(--green)',
            letterSpacing: '-0.02em',
          }}
        >
          {step}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3
            className="label-caps"
            style={{
              color: 'var(--text-primary)',
              marginBottom: '12px',
              fontSize: '1.1rem',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
