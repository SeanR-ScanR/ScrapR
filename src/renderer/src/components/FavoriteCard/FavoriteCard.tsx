import type { ReactElement } from 'react';
import * as ResourceCard from '@renderer/components/ResourceCard/ResourceCard';
import type { Thumbnail, ThumbnailSource } from '@shared/pluginTypes';

type FavoriteCardProps = {
  title: string;
  thumbnail?: Thumbnail;
  source?: ThumbnailSource;
};

export function FavoriteCard({ title, thumbnail, source }: FavoriteCardProps): ReactElement {
  return (
    <ResourceCard.Root asChild size="1">
      <li>
        <ResourceCard.Thumbnail>
          <ResourceCard.ThumbnailImage image={thumbnail} source={source} />
          <ResourceCard.ThumbnailFallback />
        </ResourceCard.Thumbnail>
        <ResourceCard.Title size="2" align="center" style={{ overflowWrap: 'anywhere' }}>
          {title}
        </ResourceCard.Title>
      </li>
    </ResourceCard.Root>
  );
}
