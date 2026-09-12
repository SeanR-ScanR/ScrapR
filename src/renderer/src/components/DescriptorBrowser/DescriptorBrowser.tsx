import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import { SearchIcon } from 'lucide-react';
import { Fragment, type ReactElement, type ReactNode, useState } from 'react';
import type { DescriptorMetadata, SourceMetadata } from '@shared/pluginTypes';
import * as Breadcrumbs from '@renderer/components/Breadcrumbs/Breadcrumbs';
import * as SearchForm from '@renderer/components/SearchForm/SearchForm';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import { ResourceGrid } from '@renderer/components/ResourceGrid/ResourceGrid';
import { ResourceView } from '@renderer/components/ResourceView/ResourceView';
import { useDescriptorBrowser } from '@renderer/hooks/useDescriptorBrowser';
import { descriptorLabels, resourceTitle } from '@renderer/utils/resourcePresentation';

export interface DescriptorBrowserProps {
  pluginId: string;
  source: SourceMetadata;
  descriptor: DescriptorMetadata;
  breadcrumbs?: ReactNode;
}

export function DescriptorBrowser({
  pluginId,
  source,
  descriptor,
  breadcrumbs
}: DescriptorBrowserProps): ReactElement {
  const browser = useDescriptorBrowser(pluginId, source.id, descriptor);
  const [input, setInput] = useState('');
  const [scope, setScope] = useState({
    pluginId,
    sourceId: source.id,
    kind: descriptor.kind
  });
  if (
    scope.pluginId !== pluginId ||
    scope.sourceId !== source.id ||
    scope.kind !== descriptor.kind
  ) {
    setScope({ pluginId, sourceId: source.id, kind: descriptor.kind });
    setInput('');
  }
  const canSearch = descriptor.operations.includes('search');
  const label = descriptorLabels[descriptor.kind];

  return (
    <Flex direction="column" gap="4" pt="4" aria-busy={browser.loading || browser.opening}>
      <Breadcrumbs.Root>
        <Breadcrumbs.List>
          {breadcrumbs}
          <Breadcrumbs.Item>
            <Breadcrumbs.Link asChild>
              <button type="button" onClick={() => void browser.back(0)}>
                {source.name}
              </button>
            </Breadcrumbs.Link>
          </Breadcrumbs.Item>
          <Breadcrumbs.Separator />
          <Breadcrumbs.Item>
            {browser.current ? (
              <Breadcrumbs.Link asChild>
                <button type="button" onClick={() => void browser.back(0)}>
                  {label}
                </button>
              </Breadcrumbs.Link>
            ) : (
              <Breadcrumbs.Current>{label}</Breadcrumbs.Current>
            )}
          </Breadcrumbs.Item>
          {browser.path.map((entity, index) => (
            <Fragment key={`${entity.kind}:${entity.id}`}>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Item>
                {index === browser.path.length - 1 ? (
                  <Breadcrumbs.Current>{resourceTitle(entity)}</Breadcrumbs.Current>
                ) : (
                  <Breadcrumbs.Link asChild>
                    <button type="button" onClick={() => void browser.back(index + 1)}>
                      {resourceTitle(entity)}
                    </button>
                  </Breadcrumbs.Link>
                )}
              </Breadcrumbs.Item>
            </Fragment>
          ))}
        </Breadcrumbs.List>
      </Breadcrumbs.Root>
      {browser.opening && <Text role="status">Chargement de la ressource...</Text>}
      {browser.detailError && (
        <Text role="alert" color="red">
          {browser.detailError}
        </Text>
      )}
      {browser.current ? (
        <>
          <ResourceView
            resource={browser.current}
            descriptors={browser.children}
            busy={browser.opening}
            onOpen={browser.open}
          />
          <Button
            variant="soft"
            onClick={() => void browser.back(browser.path.length - 1)}
            style={{ alignSelf: 'start' }}
          >
            Retour
          </Button>
        </>
      ) : (
        <>
          <SearchForm.Root onSearch={(query) => browser.search(query.trim())}>
            <Flex gap="2" wrap="wrap">
              <SearchForm.Input
                style={{ flex: '1 1 200px' }}
                placeholder={`Rechercher dans les ${label.toLowerCase()}...`}
                aria-label={`Rechercher dans les ${label.toLowerCase()}`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!canSearch}
              >
                <SearchForm.Slot>
                  <SearchIcon size={18} aria-hidden="true" />
                </SearchForm.Slot>
              </SearchForm.Input>
              <SearchForm.Submit disabled={!canSearch}>Rechercher</SearchForm.Submit>
              {browser.query && (
                <SearchForm.Clear
                  onClick={() => {
                    setInput('');
                    browser.search('');
                  }}
                >
                  Effacer
                </SearchForm.Clear>
              )}
            </Flex>
          </SearchForm.Root>
          {!canSearch && (
            <Text size="2" color="gray">
              La recherche n’est pas disponible pour ce type de ressource.
            </Text>
          )}
          <Heading size="3">
            {browser.query ? `Résultats pour "${browser.query}"` : 'Suggestions'}
          </Heading>
          <RequestState
            loading={browser.loading}
            error={browser.error}
            onRetry={() => browser.search(browser.query)}
            loadingLabel="Chargement des ressources..."
          >
            {browser.entries.length ? (
              <ResourceGrid
                entries={browser.entries}
                canOpen={descriptor.operations.includes('get')}
                busy={browser.opening}
                onOpen={browser.open}
              />
            ) : (
              <Text role="status" color="gray">
                {browser.query
                  ? 'Aucune ressource ne correspond à votre recherche.'
                  : descriptor.operations.includes('suggestions')
                    ? 'Aucune suggestion trouvée.'
                    : canSearch
                      ? 'Aucune suggestion disponible. Lancez une recherche pour trouver des ressources.'
                      : 'Ce type de ressource ne propose ni suggestions ni recherche.'}
              </Text>
            )}
          </RequestState>
        </>
      )}
    </Flex>
  );
}
