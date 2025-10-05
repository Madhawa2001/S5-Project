import { ReactNode } from 'react';
import { RiskLevel, AssessmentStatus, UserRole } from '../../types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'risk' | 'status' | 'role';
  riskLevel?: RiskLevel;
  status?: AssessmentStatus;
  role?: UserRole;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  riskLevel,
  status,
  role,
  className = '',
}: BadgeProps) {
  let badgeStyles = 'inline-block px-3 py-1 rounded-full text-sm font-semibold';

  if (variant === 'risk' && riskLevel) {
    const riskStyles = {
      HIGH: 'bg-risk-high text-white',
      MEDIUM: 'bg-risk-medium text-white',
      LOW: 'bg-risk-low text-white',
    };
    badgeStyles += ` ${riskStyles[riskLevel]}`;
  } else if (variant === 'status' && status) {
    const statusStyles = {
      draft: 'bg-gray-200 text-gray-700',
      awaiting_review: 'bg-amber-100 text-amber-800',
      reviewed: 'bg-green-100 text-green-800',
    };
    badgeStyles += ` ${statusStyles[status]}`;
  } else if (variant === 'role' && role) {
    const roleStyles = {
      admin: 'bg-purple-100 text-purple-800',
      doctor: 'bg-blue-100 text-blue-800',
      lab_assistant: 'bg-teal-100 text-teal-800',
    };
    badgeStyles += ` ${roleStyles[role]}`;
  } else {
    badgeStyles += ' bg-gray-200 text-gray-700';
  }

  return <span className={`${badgeStyles} ${className}`}>{children}</span>;
}
