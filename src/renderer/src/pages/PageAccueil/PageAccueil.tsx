import { Badge, Button, Flex, Grid, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import { Link } from '@tanstack/react-router';
import { favoriteKey } from '@shared/favoriteTypes';
import { DescriptorPathSchema } from '@shared/pluginTypes';
import * as ResourceCard from '@renderer/components/ResourceCard/ResourceCard';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import { useFavorites } from '@renderer/hooks/useFavorites';
import { descriptorLabels } from '@renderer/utils/resourcePresentation';

export default function PageAccueil(): ReactElement {
  const favorites = useFavorites();
  return (
    <Flex direction="column" gap="6">
      <PageSection title="Favoris">
        <RequestState
          loading={favorites.loading}
          hasData={favorites.hasData}
          error={favorites.error}
          onRetry={favorites.retry}
          loadingLabel="Chargement des favoris..."
        >
          {favorites.items.length ? (
            <Grid asChild columns="repeat(auto-fill, minmax(min(180px, 100%), 1fr))" gap="4">
              <ul aria-label="Favoris">
                {favorites.items.map((favorite) => (
                  <ResourceCard.Root key={favoriteKey(favorite)} asChild size="1">
                    <li>
                      <ResourceCard.Thumbnail>
                        <ResourceCard.ThumbnailImage
                          image={favorite.thumbnail}
                          source={{
                            pluginId: favorite.pluginId,
                            sourceId: favorite.sourceId,
                            path: DescriptorPathSchema.parse(
                              favorite.resource.map(({ kind }) => kind)
                            )
                          }}
                        />
                        <ResourceCard.ThumbnailFallback />
                        <ResourceCard.Actions position="thumbnail-bottom-left">
                          <Badge variant="solid">
                            {descriptorLabels[favorite.resource[favorite.resource.length - 1].kind]}
                          </Badge>
                        </ResourceCard.Actions>
                        <ResourceCard.Actions position="thumbnail-top-right">
                          <ResourceCard.FavoriteAction
                            favorite
                            loading={favorites.isPending(favorite)}
                            disabled={favorites.disabled}
                            onFavoriteChange={() =>
                              favorites.change({ favorite: false, resource: favorite })
                            }
                          />
                        </ResourceCard.Actions>
                      </ResourceCard.Thumbnail>
                      <ResourceCard.Title size="2">{favorite.title}</ResourceCard.Title>
                      {favorite.date && (
                        <ResourceCard.Description>{favorite.date}</ResourceCard.Description>
                      )}
                      {favorite.description && (
                        <ResourceCard.Description size="2">
                          {favorite.description}
                        </ResourceCard.Description>
                      )}
                      <ResourceCard.Footer>
                        <ResourceCard.Actions position="bottom-right">
                          <Button asChild variant="soft">
                            <Link
                              to="/explore/$pluginId/$sourceId"
                              params={{ pluginId: favorite.pluginId, sourceId: favorite.sourceId }}
                              search={{
                                kind: favorite.resource[0].kind,
                                resource: favorite.resource,
                                origin: favorite.origin
                              }}
                              aria-label={`Voir les détails : ${favorite.title}`}
                            >
                              Voir les détails
                            </Link>
                          </Button>
                        </ResourceCard.Actions>
                      </ResourceCard.Footer>
                    </li>
                  </ResourceCard.Root>
                ))}
              </ul>
            </Grid>
          ) : (
            <Text role="status" color="gray">
              Aucun favori pour le moment.
            </Text>
          )}
        </RequestState>
      </PageSection>
    </Flex>
  );
}
