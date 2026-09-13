import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import type { ComponentProps, ComponentPropsWithoutRef, ReactElement } from 'react';

export function Root(props: ComponentPropsWithoutRef<'ul'>): ReactElement {
  return (
    <Flex asChild direction="column" gap="3">
      <ul {...props} />
    </Flex>
  );
}

export function Item(props: ComponentPropsWithoutRef<'li'>): ReactElement {
  return (
    <Card asChild size="3">
      <li {...props} />
    </Card>
  );
}

export function Header(props: ComponentProps<typeof Flex>): ReactElement {
  return <Flex direction="column" gap="1" {...props} />;
}

export function Title(props: ComponentProps<typeof Heading>): ReactElement {
  return <Heading as="h3" size="4" {...props} />;
}

export function Description(props: ComponentProps<typeof Text>): ReactElement {
  return <Text as="p" size="2" color="gray" {...props} />;
}

export function Content(props: ComponentProps<typeof Box>): ReactElement {
  return <Box mt="3" {...props} />;
}
