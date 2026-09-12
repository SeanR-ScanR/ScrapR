import { Avatar, Badge, Card, Flex, Text } from '@radix-ui/themes';
import { ImageOffIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

type SourceItemProps = {
  title: string;
  language: string;
  children?: ReactNode;
};

export function Root(props: ComponentPropsWithoutRef<'ul'>): ReactElement {
  return (
    <Flex asChild direction="column" gap="2">
      <ul {...props} />
    </Flex>
  );
}

export function Item({ title, language, children }: SourceItemProps): ReactElement {
  return (
    <Card asChild size="2">
      <li>
        <Flex align="center" gap="3" wrap="wrap">
          <Avatar size="2" color="gray" fallback={<ImageOffIcon size={18} aria-hidden="true" />} />
          <Flex align="center" gap="2" wrap="wrap" flexGrow="1" minWidth="0">
            <Text size="2" weight="medium">
              {title}
            </Text>
            <Badge color="gray" variant="soft">
              {language}
            </Badge>
          </Flex>
          {children}
        </Flex>
      </li>
    </Card>
  );
}

export function Actions(props: ComponentPropsWithoutRef<'div'>): ReactElement {
  return <Flex role="group" align="center" gap="2" ml="auto" flexShrink="0" {...props} />;
}
