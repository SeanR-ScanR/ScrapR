import { Button, Flex, Grid } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import type { AnyEntity, AnyPreview, ThumbnailSource } from '@shared/pluginTypes';
import type { FavoriteInput } from '@shared/favoriteTypes';
import * as ResourceCard from '@renderer/components/ResourceCard/ResourceCard';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import { resourceTitle } from '@renderer/utils/resourcePresentation';
import { useThumbnailPrefetch } from '@renderer/hooks/useThumbnailPrefetch';
import { useFavorites } from '@renderer/hooks/useFavorites';
import { useResourceVirtualizer } from './useResourceVirtualizer';

export interface ResourceGridProps {
  source: ThumbnailSource;
  parents: readonly AnyEntity[];
  origin?: FavoriteInput['origin'];
  entries: AnyPreview[];
  canOpen: boolean;
  busy?: boolean;
  onOpen: (entry: AnyPreview) => void;
}

export function ResourceGrid({
  source,
  parents,
  origin,
  entries,
  canOpen,
  busy,
  onOpen
}: ResourceGridProps): ReactElement {
  'use no memo'; // TanStack Virtual exposes a mutable virtualizer that must not be compiler-memoized.

  const favorites = useFavorites();
  useThumbnailPrefetch(entries, source);
  const { gridRef, virtualizer, columns, scrollMargin, onFocusCapture, onBlurCapture } =
    useResourceVirtualizer(entries, canOpen);

  return (
    <>
      {favorites.error && (
        <RequestState loading={false} error={favorites.error} onRetry={favorites.retry}>
          {null}
        </RequestState>
      )}
      <Grid
        ref={gridRef}
        role="list"
        columns={{ initial: '1', xs: '2', sm: '3', md: '4', lg: '5', xl: '7' }}
        gap="3"
        style={{
          position: 'relative',
          height: virtualizer.getTotalSize(),
          flexShrink: 0,
          overflowAnchor: 'none'
        }}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
      >
        {virtualizer.getVirtualItems().map((row) => (
          <Grid
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            role="presentation"
            gap="3"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              gridTemplateColumns: 'inherit',
              transform: `translateY(${row.start - scrollMargin}px)`
            }}
          >
            {entries.slice(row.index * columns, (row.index + 1) * columns).map((entry, column) => {
              const index = row.index * columns + column;
              const identity = {
                pluginId: source.pluginId,
                sourceId: source.sourceId,
                resource: [
                  ...parents.map(({ kind, id }) => ({ kind, id })),
                  { kind: entry.kind, id: entry.id }
                ]
              };
              return (
                <ResourceCard.Root
                  key={`${entry.kind}:${entry.id}:${index}`}
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={entries.length}
                  data-resource-index={index}
                  style={{ contain: 'none', isolation: 'isolate' }}
                >
                  <ResourceCard.Thumbnail>
                    <ResourceCard.ThumbnailImage image={entry.thumbnail} source={source} />
                    <ResourceCard.ThumbnailFallback />
                    {canOpen && (
                      <ResourceCard.Actions position="thumbnail-top-right">
                        <ResourceCard.FavoriteAction
                          favorite={favorites.has(identity)}
                          loading={favorites.isPending(identity)}
                          disabled={favorites.disabled}
                          onFavoriteChange={(favorite) =>
                            favorites.change(
                              favorite
                                ? {
                                    favorite,
                                    resource: {
                                      pluginId: source.pluginId,
                                      sourceId: source.sourceId,
                                      parents,
                                      kind: entry.kind,
                                      id: entry.id,
                                      origin
                                    }
                                  }
                                : { favorite, resource: identity }
                            )
                          }
                        />
                      </ResourceCard.Actions>
                    )}
                  </ResourceCard.Thumbnail>
                  <Flex direction="column" gap="3" style={{ overflowWrap: 'anywhere' }}>
                    <ResourceCard.Title>{resourceTitle(entry)}</ResourceCard.Title>
                    {'date' in entry && (
                      <ResourceCard.Description>{entry.date}</ResourceCard.Description>
                    )}
                    {!canOpen && (
                      <ResourceCard.Description size="2">
                        Les détails ne sont pas disponibles pour cette source.
                      </ResourceCard.Description>
                    )}
                  </Flex>
                  {canOpen && (
                    <ResourceCard.Footer>
                      <ResourceCard.Actions position="bottom-right">
                        <Button
                          variant="soft"
                          disabled={busy}
                          onClick={() => onOpen(entry)}
                          aria-label={`Voir les détails : ${resourceTitle(entry)}`}
                        >
                          Voir les détails
                        </Button>
                      </ResourceCard.Actions>
                    </ResourceCard.Footer>
                  )}
                </ResourceCard.Root>
              );
            })}
          </Grid>
        ))}
      </Grid>
    </>
  );
}
