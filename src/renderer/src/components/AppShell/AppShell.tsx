import { Flex, type FlexProps } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import AppTheme from '../AppTheme/AppTheme';
import styles from './AppShell.module.css';

export function Root(props: FlexProps): ReactElement {
  return <Flex direction="column" height="100dvh" overflow="hidden" {...props} />;
}

export function Header(props: ComponentPropsWithoutRef<'header'>): ReactElement {
  return (
    <AppTheme>
      <Flex asChild flexShrink="0" px="4" py="2" className={styles.header}>
        <header {...props} />
      </Flex>
    </AppTheme>
  );
}

export function Body(props: FlexProps): ReactElement {
  return <Flex flexGrow="1" minHeight="0" overflow="hidden" {...props} />;
}

export function Sidebar(props: ComponentPropsWithoutRef<'aside'>): ReactElement {
  return (
    <AppTheme>
      <Flex
        asChild
        direction="column"
        width={{ initial: '144px', sm: '200px' }}
        flexShrink="0"
        overflowY="auto"
        className={styles.sidebar}
      >
        <aside {...props} />
      </Flex>
    </AppTheme>
  );
}

export function Content(props: ComponentPropsWithoutRef<'main'>): ReactElement {
  return (
    <AppTheme>
      <Flex
        asChild
        direction="column"
        flexGrow="1"
        minWidth="0"
        p={{ initial: '4', sm: '6' }}
        overflowY="auto"
        className={styles.content}
      >
        <main {...props} />
      </Flex>
    </AppTheme>
  );
}
