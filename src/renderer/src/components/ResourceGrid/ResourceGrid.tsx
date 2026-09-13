import { Button, Flex, Grid, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import type { AnyPreview, ThumbnailSource } from '@shared/pluginTypes';
import * as ResourceCard from '@renderer/components/ResourceCard/ResourceCard';
import { resourceTitle } from '@renderer/utils/resourcePresentation';
import { useThumbnailPrefetch } from '@renderer/hooks/useThumbnailPrefetch';
import { useResourceVirtualizer } from './useResourceVirtualizer';

export interface ResourceGridProps {
  source: ThumbnailSource;
  entries: AnyPreview[];
  canOpen: boolean;
  busy?: boolean;
  onOpen: (entry: AnyPreview) => void;
}

export function ResourceGrid({
  source,
  entries,
  canOpen,
  busy,
  onOpen
}: ResourceGridProps): ReactElement {
  'use no memo'; // TanStack Virtual exposes a mutable virtualizer that must not be compiler-memoized.

  useThumbnailPrefetch(entries, source);
  const { gridRef, virtualizer, columns, scrollMargin, onFocusCapture, onBlurCapture } =
    useResourceVirtualizer(entries, canOpen);

  return (
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
                </ResourceCard.Thumbnail>
                <Flex direction="column" gap="3" style={{ overflowWrap: 'anywhere' }}>
                  <ResourceCard.Title>{resourceTitle(entry)}</ResourceCard.Title>
                  {'date' in entry && (
                    <ResourceCard.Description>{entry.date}</ResourceCard.Description>
                  )}
                  <ResourceCard.Actions>
                    {canOpen ? (
                      <Button
                        variant="soft"
                        disabled={busy}
                        onClick={() => onOpen(entry)}
                        aria-label={`Voir les détails : ${resourceTitle(entry)}`}
                      >
                        Voir les détails
                      </Button>
                    ) : (
                      <Text size="2" color="gray">
                        Les détails ne sont pas disponibles pour cette source.
                      </Text>
                    )}
                  </ResourceCard.Actions>
                </Flex>
              </ResourceCard.Root>
            );
          })}
        </Grid>
      ))}
    </Grid>
  );
}
