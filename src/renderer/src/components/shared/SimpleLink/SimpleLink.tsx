import type { ReactElement } from 'react';
import { Link, LinkProps } from '@tanstack/react-router';
import style from './SimpleLink.module.css';

export default function SimpleLink({ children, ...props }: LinkProps): ReactElement {
  return (
    <Link className={style.link} {...props}>
      {children}
    </Link>
  );
}
