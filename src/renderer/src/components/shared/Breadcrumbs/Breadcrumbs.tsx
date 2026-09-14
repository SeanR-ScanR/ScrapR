import { Flex, Link as RadixLink, Text } from '@radix-ui/themes';
import type { ComponentProps, MouseEventHandler, ReactElement, ReactNode } from 'react';
import style from './BreadCrumbs.module.css';

export type RootProps = ComponentProps<'nav'>;
export type ListProps = ComponentProps<'ol'>;
export type ItemProps = ComponentProps<'li'>;
export type LinkProps = ComponentProps<typeof RadixLink>;
export type CurrentProps = ComponentProps<typeof Text>;
export type SeparatorProps = ComponentProps<'li'>;
export type ButtonProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  isCurrent?: boolean;
};

export function Root(props: RootProps): ReactElement {
  return <nav aria-label="Fil d’Ariane" {...props} />;
}

export function List({ style, ...props }: ListProps): ReactElement {
  return (
    <Flex asChild align="center" gap="2" wrap="wrap">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, ...style }} {...props} />
    </Flex>
  );
}

export function Item({ style, ...props }: ItemProps): ReactElement {
  return (
    <Flex asChild align="center" gap="2">
      <li style={{ minWidth: 0, overflowWrap: 'anywhere', ...style }} {...props} />
    </Flex>
  );
}

export function Link(props: LinkProps): ReactElement {
  return <RadixLink {...props} />;
}

export function Button({ children, onClick, isCurrent = false }: ButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${style.button} ${isCurrent && style.button_current}`}
    >
      {children}
    </button>
  );
}

export function Current(props: CurrentProps): ReactElement {
  return <Text aria-current="page" {...props} />;
}

export function Separator({ children = '•', ...props }: SeparatorProps): ReactElement {
  return (
    <li aria-hidden="true" className={style.separator} {...props}>
      {children}
    </li>
  );
}
