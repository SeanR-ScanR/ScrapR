import { ReactNode } from 'react';

export default interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isBottom?: boolean;
}
