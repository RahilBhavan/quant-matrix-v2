import React from 'react';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'data';
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  children,
  className = '',
  uppercase = false,
  as,
}) => {
  const Component = as || (variant.startsWith('h') ? variant : 'p');

  const baseClasses: Record<string, string> = {
    h1: 'text-h1',
    h2: 'text-h2',
    h3: 'text-h3',
    body: 'text-body',
    small: 'text-small text-gray-600',
    data: 'text-data',
  };

  const classes = `${baseClasses[variant]} ${uppercase ? 'uppercase' : ''} ${className}`;

  return <Component className={classes}>{children}</Component>;
};

interface DataTextProps {
  children: React.ReactNode;
  className?: string;
  success?: boolean;
  error?: boolean;
}

export const DataText: React.FC<DataTextProps> = ({
  children,
  className = '',
  success,
  error,
}) => {
  const colorClass = success ? 'text-success' : error ? 'text-error' : '';
  return (
    <span className={`font-mono text-data ${colorClass} ${className}`}>
      {children}
    </span>
  );
};
