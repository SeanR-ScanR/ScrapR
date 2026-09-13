import { AspectRatio, Card, Flex, IconButton, Inset, Text } from '@radix-ui/themes';
import { HeartIcon, ImageOffIcon } from 'lucide-react';
import { Avatar } from 'radix-ui';
import { createContext, useContext, useState, type ComponentProps, type ReactElement } from 'react';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { useThumbnail } from '@renderer/hooks/useThumbnail';
import type { Thumbnail as ThumbnailValue, ThumbnailSource } from '@shared/pluginTypes';
import './ResourceCard.css';

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
export type FooterProps = ComponentProps<typeof Flex>;
export type ActionsProps = ComponentProps<typeof Flex> & {
  position?:
    | 'bottom-left'
    | 'bottom-right'
    | 'thumbnail-top-left'
    | 'thumbnail-top-right'
    | 'thumbnail-bottom-left'
    | 'thumbnail-bottom-right';
};
export type FavoriteActionProps = Omit<ComponentProps<typeof IconButton>, 'children'> & {
  favorite: boolean;
  onFavoriteChange: (favorite: boolean) => void;
};

export function Root({ className = '', ...props }: RootProps): ReactElement {
  return <Card className={`resource-card ${className}`} {...props} />;
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
              position: 'relative',
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

export function Title({ className = '', ...props }: TitleProps): ReactElement {
  return (
    <Text
      as="p"
      weight="medium"
      align="left"
      className={`resource-card-title ${className}`}
      {...props}
    />
  );
}

export function Description({ className = '', ...props }: DescriptionProps): ReactElement {
  return (
    <Text as="p" color="gray" className={`resource-card-description ${className}`} {...props} />
  );
}

export function Footer({ className = '', ...props }: FooterProps): ReactElement {
  return <Flex gap="2" pt="3" className={`resource-card-footer ${className}`} {...props} />;
}

export function Actions({
  position = 'bottom-right',
  className = '',
  ...props
}: ActionsProps): ReactElement {
  return (
    <Flex
      role="group"
      align="center"
      gap="2"
      wrap="wrap"
      className={`resource-card-actions ${className}`}
      data-position={position}
      {...props}
    />
  );
}

export function FavoriteAction({
  favorite,
  onFavoriteChange,
  loading = false,
  disabled,
  className = '',
  onClick,
  ...props
}: FavoriteActionProps): ReactElement {
  const label = favorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
  return (
    <IconButton
      type="button"
      variant="solid"
      color={favorite ? 'crimson' : 'gray'}
      aria-label={label}
      aria-pressed={favorite}
      aria-busy={loading}
      loading={loading}
      disabled={disabled || loading}
      title={label}
      className={`resource-card-favorite ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
        if (!event.defaultPrevented) onFavoriteChange(!favorite);
      }}
      {...props}
    >
      <HeartIcon size={18} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
    </IconButton>
  );
}
