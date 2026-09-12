import { Flex, Heading, Text } from '@radix-ui/themes';
import type { ComponentProps, ReactElement } from 'react';

export type RootProps = ComponentProps<typeof Flex>;
export type TitleProps = ComponentProps<typeof Heading>;
export type DescriptionProps = ComponentProps<typeof Text>;
export type MetadataProps = ComponentProps<typeof Flex>;
export type ImageProps = ComponentProps<'img'>;

export function Root(props: RootProps): ReactElement {
  return <Flex direction="column" gap="4" {...props} />;
}

export function Title(props: TitleProps): ReactElement {
  return <Heading {...props} />;
}

export function Description({ style, ...props }: DescriptionProps): ReactElement {
  return <Text as="p" style={{ whiteSpace: 'pre-wrap', ...style }} {...props} />;
}

export function Metadata(props: MetadataProps): ReactElement {
  return <Flex gap="2" wrap="wrap" {...props} />;
}

export function Image({ style, ...props }: ImageProps): ReactElement {
  return (
    <img
      alt=""
      style={{ display: 'block', maxWidth: '100%', height: 'auto', ...style }}
      {...props}
    />
  );
}
