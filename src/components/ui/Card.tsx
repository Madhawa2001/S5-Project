import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-card ${className}`}>
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
}
