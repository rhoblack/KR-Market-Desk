import type { ReactNode } from 'react';

interface TagProps {
  children: ReactNode;
  tone?: 'accent' | 'neutral' | 'warn' | 'info' | 'up' | 'down';
}

export function Tag({ children, tone = 'neutral' }: TagProps) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}
