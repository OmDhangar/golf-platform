import React, { useState, useRef, useEffect } from 'react';

interface UserDropdownProps {
  username?: string;
  onLogout?: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  username = "User",
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      window.location.href = '/login';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--green)';
          e.currentTarget.style.background = 'var(--bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'var(--bg-card)';
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: 'var(--green)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 700,
            fontSize: '0.7rem',
          }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        {username}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transition: 'transform 0.15s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            minWidth: 180,
            overflow: 'hidden',
          }}
        >
          <a
            href="/dashboard"
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
              border: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
          >
            📊 Dashboard
          </a>
          <a
            href="/"
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
              border: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
          >
            🏠 Home
          </a>
          <div
            style={{
              height: '1px',
              background: 'var(--border)',
              margin: '4px 0',
            }}
          />
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              padding: '12px 16px',
              color: 'var(--red)',
              textDecoration: 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              transition: 'background 0.15s',
              border: 'none',
              background: 'transparent',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--red-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};
