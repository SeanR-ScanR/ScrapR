import { AspectRatio, Card, Flex, Inset, Text } from '@radix-ui/themes';
import { ImageOffIcon } from 'lucide-react';
import { Avatar } from 'radix-ui';
import { createContext, useContext, useState, type ComponentProps, type ReactElement } from 'react';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { useThumbnail } from '@renderer/hooks/useThumbnail';
import type { Thumbnail as ThumbnailValue, ThumbnailSource } from '@shared/pluginTypes';

const ThumbnailElementContext = createContext<HTMLElement | null>(null);

export type RootProps = ComponentProps<typeof Card>;
export type ThumbnailProps = ComponentProps<typeof Avatar.Root> &
  Pick<ComponentProps<typeof AspectRatio>, 'ratio'>;
export type ThumbnailImageProps = Omit<ComponentProps<typeof Avatar.Image>, 'src' | 'srcSet'> & {
  image?: ThumbnailValue;
  source?: ThumbnailSource;
};
export type ThumbnailFallbackProps = ComponentProps<typeof Avatar.Fallback>;
export type TitleProps = ComponentProps<typeof Text>;
export type DescriptionProps = ComponentProps<typeof Text>;
export type ActionsProps = ComponentProps<typeof Flex>;

export function Root(props: RootProps): ReactElement {
  return <Card {...props} />;
}

export function Thumbnail({ ratio = 3 / 4, style, ref, ...props }: ThumbnailProps): ReactElement {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const composedRef = useComposedRefs(ref, setElement);
  return (
    <ThumbnailElementContext value={element}>
      <Inset clip="padding-box" side="top" mb="3">
        <AspectRatio ratio={ratio}>
          <Avatar.Root
            ref={composedRef}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              background: 'var(--gray-4)',
              ...style
            }}
            {...props}
          />
        </AspectRatio>
      </Inset>
    </ThumbnailElementContext>
  );
}

export function ThumbnailImage({
  image,
  source,
  style,
  ...props
}: ThumbnailImageProps): ReactElement {
  const element = useContext(ThumbnailElementContext);
  const { src } = useThumbnail(image, source, element);
  return (
    <Avatar.Image
      alt=""
      decoding="async"
      src={src}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
      {...props}
    />
  );
}

export function ThumbnailFallback({
  children = <ImageOffIcon size={24} aria-hidden="true" />,
  style,
  ...props
}: ThumbnailFallbackProps): ReactElement {
  return (
    <Avatar.Fallback
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: 'var(--gray-9)',
        ...style
      }}
      {...props}
    >
      {children}
    </Avatar.Fallback>
  );
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
