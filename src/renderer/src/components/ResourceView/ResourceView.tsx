import { Box, Flex, Text } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { FavoriteInput } from '@shared/favoriteTypes';
import type {
  AnyEntity,
  AnyPreview,
  DescriptorMetadata,
  ThumbnailSource
} from '@shared/pluginTypes';
import { DescriptorKindSchema, DescriptorPathSchema } from '@shared/pluginTypes';
import * as ResourceDetails from '@renderer/components/shared/ResourceDetails/ResourceDetails';
import * as ResourceCard from '@renderer/components/shared/ResourceCard/ResourceCard';
import { PageSection } from '@renderer/components/shared/PageSection/PageSection';
import { ResourceGrid } from '@renderer/components/ResourceGrid/ResourceGrid';
import { RequestState } from '@renderer/components/shared/RequestState/RequestState';
import { useFavorites } from '@renderer/hooks/useFavorites';
import { descriptorQueries } from '@renderer/services/ipcQueries';
import { descriptorLabels, resourceTitle } from '@renderer/utils/resourcePresentation';

export interface ResourceViewProps {
  source: ThumbnailSource;
  resource: AnyEntity;
  resourcePath: readonly AnyEntity[];
  origin?: FavoriteInput['origin'];
  descriptors: DescriptorMetadata[];
  busy?: boolean;
  onOpen: (entry: AnyPreview) => void;
}

export function ResourceView({
  source,
  resource,
  resourcePath,
  origin,
  descriptors,
  busy,
  onOpen
}: ResourceViewProps): ReactElement {
  const favorites = useFavorites();
  const capabilities = useQuery(
    descriptorQueries.capabilities(source.pluginId, source.sourceId, source.path)
  );
  const identity = {
    pluginId: source.pluginId,
    sourceId: source.sourceId,
    resource: resourcePath.map(({ kind, id }) => ({ kind, id }))
  };
  const favorite = favorites.has(identity);
  const pending = favorites.isPending(identity);
  const title = resourceTitle(resource);

  return (
    <ResourceDetails.Root>
      <Flex direction={{ initial: 'column', sm: 'row' }} align="start" gap="4">
        {resource.kind !== 'page' && (
          <Box width="100%" maxWidth="240px" flexShrink="0">
            <ResourceCard.Root>
              <ResourceCard.Thumbnail>
                <ResourceCard.ThumbnailImage
                  image={resource.thumbnail}
                  source={source}
                  alt={title}
                />
                <ResourceCard.ThumbnailFallback />
              </ResourceCard.Thumbnail>
            </ResourceCard.Root>
          </Box>
        )}
        <Flex direction="column" gap="3" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <Flex align="start" gap="3">
            <ResourceDetails.Title>{title}</ResourceDetails.Title>
            {(favorite || capabilities.data?.includes('get')) && (
              <ResourceCard.FavoriteAction
                favorite={favorite}
                loading={pending}
                disabled={favorites.disabled}
                style={{ flexShrink: 0 }}
                onFavoriteChange={(favorite) =>
                  favorites.change(
                    favorite
                      ? {
                          favorite,
                          resource: {
                            pluginId: source.pluginId,
                            sourceId: source.sourceId,
                            parents: resourcePath.slice(0, -1),
                            kind: resource.kind,
                            id: resource.id,
                            origin
                          }
                        }
                      : { favorite, resource: identity }
                  )
                }
              />
            )}
          </Flex>
          {'date' in resource && (
            <ResourceDetails.Metadata>
              <Text>{resource.date}</Text>
            </ResourceDetails.Metadata>
          )}
          {'description' in resource && resource.description && (
            <ResourceDetails.Description>{resource.description}</ResourceDetails.Description>
          )}
        </Flex>
      </Flex>
      {favorites.error && (
        <RequestState loading={false} error={favorites.error} onRetry={favorites.retry}>
          {null}
        </RequestState>
      )}
      {capabilities.isError && (
        <RequestState
          loading={false}
          error={capabilities.error.message}
          onRetry={() => void capabilities.refetch()}
        >
          {null}
        </RequestState>
      )}
      {resource.kind === 'page' ? (
        <ResourceDetails.Image src={resource.dataUri} alt={title} />
      ) : (
        <>
          {DescriptorKindSchema.options.map((kind) => {
            const entries = resource.has?.[kind];
            if (!entries) return null;
            return (
              <PageSection key={kind} title={descriptorLabels[kind]}>
                {entries.length ? (
                  <ResourceGrid
                    source={{ ...source, path: DescriptorPathSchema.parse([...source.path, kind]) }}
                    entries={entries}
                    parents={resourcePath}
                    origin={origin}
                    canOpen={descriptors.some(
                      (descriptor) =>
                        descriptor.kind === kind && descriptor.operations.includes('get')
                    )}
                    busy={busy}
                    onOpen={onOpen}
                  />
                ) : (
                  <Text color="gray">
                    Aucune ressource disponible dans la catégorie &quot;{descriptorLabels[kind]}
                    &quot;.
                  </Text>
                )}
              </PageSection>
            );
          })}
          {!Object.keys(resource.has ?? {}).length && (
            <Text color="gray">Cette ressource ne contient aucune autre ressource.</Text>
          )}
        </>
      )}
    </ResourceDetails.Root>
  );
}
