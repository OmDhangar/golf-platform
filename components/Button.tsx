import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  href,
  className = '',
  disabled = false,
  style,
}) => {
  const baseClasses = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
  };

  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`${baseClasses[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </button>
  );
};
