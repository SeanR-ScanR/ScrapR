import { Card, Flex, Text } from '@radix-ui/themes';
import type { ComponentProps, ReactElement } from 'react';

export type RootProps = ComponentProps<typeof Card>;
export type TitleProps = ComponentProps<typeof Text>;
export type DescriptionProps = ComponentProps<typeof Text>;
export type ActionsProps = ComponentProps<typeof Flex>;

export function Root(props: RootProps): ReactElement {
  return <Card {...props} />;
}

export function Title(props: TitleProps): ReactElement {
  return <Text as="p" weight="medium" {...props} />;
}

export function Description(props: DescriptionProps): ReactElement {
  return <Text as="p" color="gray" {...props} />;
}

export function Actions(props: ActionsProps): ReactElement {
  return <Flex role="group" align="center" gap="2" wrap="wrap" {...props} />;
}
