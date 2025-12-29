import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  monospace?: boolean;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  monospace = false,
  className = '',
  ...props
}) => {
  const errorClass = error ? 'border-error border-b-2' : '';
  const fontClass = monospace ? 'font-mono' : '';

  return (
    <input
      className={`input-base ${errorClass} ${fontClass} ${className}`}
      {...props}
    />
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  const errorClass = error ? 'border-error' : 'border-border';

  return (
    <textarea
      className={`border ${errorClass} bg-transparent px-3 py-2 focus:border-2 focus:border-ink outline-none font-mono resize-none ${className}`}
      {...props}
    />
  );
};
