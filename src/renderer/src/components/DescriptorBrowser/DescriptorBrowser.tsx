import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import { SearchIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { DescriptorPathSchema, getParentPath } from '@shared/pluginTypes';
import * as SearchForm from '@renderer/components/shared/SearchForm/SearchForm';
import { RequestState } from '@renderer/components/shared/RequestState/RequestState';
import { LoadingState } from '@renderer/components/shared/LoadingState/LoadingState';
import { ResourceGrid } from '@renderer/components/ResourceGrid/ResourceGrid';
import { ResourceView } from '@renderer/components/ResourceView/ResourceView';
import { DescriptorBrowserEntity } from '@renderer/hooks/useDescriptorBrowser';
import { descriptorLabels } from '@renderer/utils/resourcePresentation';
import { BrowserRetry } from '@renderer/components/shared/BrowserRetry/BrowserRetry';

export function DescriptorBrowser(browser: DescriptorBrowserEntity): ReactElement {
  const [input, setInput] = useState(browser.query);
  const canSearch = browser.descriptorProps.descriptor.operations.includes('search');
  const label = descriptorLabels[browser.descriptorProps.descriptor.kind];

  return (
    <Flex direction="column" gap="4" pt="4" aria-busy={browser.fetching || browser.opening}>
      {browser.detailError && (
        <Text role="alert" color="red">
          {browser.detailError}
        </Text>
      )}
      {browser.opening ? (
        <LoadingState label="Chargement de la ressource..." />
      ) : browser.resourcePending ? (
        <BrowserRetry browser={browser} />
      ) : browser.current ? (
        <>
          <Button
            variant="soft"
            onClick={() => void browser.back(browser.path.length - 1)}
            style={{ alignSelf: 'start' }}
          >
            Retour
          </Button>
          <ResourceView
            source={{
              pluginId: browser.descriptorProps.pluginId,
              sourceId: browser.descriptorProps.source.id,
              path: DescriptorPathSchema.parse(getParentPath(browser.path))
            }}
            resource={browser.current}
            resourcePath={browser.path}
            origin={browser.descriptorProps.search.origin}
            descriptors={browser.children}
            busy={browser.opening}
            onOpen={browser.open}
          />
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
            fetching={browser.fetching}
            hasData={browser.hasData}
            error={browser.error}
            onRetry={() => browser.search(browser.query)}
            loadingLabel="Chargement des ressources..."
          >
            {browser.entries.length ? (
              <ResourceGrid
                source={{
                  pluginId: browser.descriptorProps.pluginId,
                  sourceId: browser.descriptorProps.source.id,
                  path: [browser.descriptorProps.descriptor.kind]
                }}
                parents={[]}
                entries={browser.entries}
                canOpen={browser.descriptorProps.descriptor.operations.includes('get')}
                busy={browser.opening}
                onOpen={browser.open}
              />
            ) : (
              <Text role="status" color="gray">
                {browser.query
                  ? 'Aucune ressource ne correspond à votre recherche.'
                  : browser.descriptorProps.descriptor.operations.includes('suggestions')
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
