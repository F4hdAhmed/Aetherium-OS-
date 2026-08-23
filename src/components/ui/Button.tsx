import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { IconName } from '../icons/Icon';
import { Icon } from '../icons/Icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  children: ReactNode;
}

export function Button({ variant = 'secondary', icon, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}

