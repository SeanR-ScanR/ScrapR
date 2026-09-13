import { Flex, Link as RadixLink, Text } from '@radix-ui/themes';
import type { ComponentProps, ReactElement } from 'react';

export type RootProps = ComponentProps<'nav'>;
export type ListProps = ComponentProps<'ol'>;
export type ItemProps = ComponentProps<'li'>;
export type LinkProps = ComponentProps<typeof RadixLink>;
export type CurrentProps = ComponentProps<typeof Text>;
export type SeparatorProps = ComponentProps<'li'>;

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

export function Current(props: CurrentProps): ReactElement {
  return <Text aria-current="page" {...props} />;
}

export function Separator({ children = '/', ...props }: SeparatorProps): ReactElement {
  return (
    <li aria-hidden="true" {...props}>
      {children}
    </li>
  );
}
