import { Badge, Flex, IconButton, Text } from '@radix-ui/themes';
import { GlobeIcon, SearchIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PageSection } from '@renderer/components/shared/PageSection/PageSection';
import * as PluginList from '@renderer/components/shared/PluginList/PluginList';
import { RequestState } from '@renderer/components/shared/RequestState/RequestState';
import * as SearchForm from '@renderer/components/shared/SearchForm/SearchForm';
import * as SourceList from '@renderer/components/shared/SourceList/SourceList';
import { usePlugins } from '@renderer/hooks/useRepository';

export default function PageExtension(): ReactElement {
  const { items: plugins, loading, fetching, hasData, error, retry } = usePlugins();
  const [query, setQuery] = useState('');
  const search = query.trim().toLocaleLowerCase();
  const filtered = plugins.filter((plugin) =>
    [plugin.name, plugin.id, ...plugin.sources.flatMap((source) => [source.name, source.id])].some(
      (value) => value.toLocaleLowerCase().includes(search)
    )
  );

  return (
    <Flex direction="column" gap="6">
      <PageSection title="Extensions">
        <Text as="p" color="gray">
          Extensions intégrées à l&apos;application. L&apos;installation et la suppression ne sont
          pas disponibles.
        </Text>
        <SearchForm.Root onSearch={setQuery}>
          <SearchForm.Input
            size="3"
            placeholder="Rechercher une extension ou une source"
            aria-label="Rechercher une extension ou une source"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          >
            <SearchForm.Slot>
              <SearchIcon size={18} aria-hidden="true" />
            </SearchForm.Slot>
          </SearchForm.Input>
        </SearchForm.Root>
      </PageSection>
      <PageSection title="Extensions intégrées">
        <RequestState
          loading={loading}
          fetching={fetching}
          hasData={hasData}
          error={error}
          onRetry={retry}
          loadingLabel="Chargement des extensions..."
        >
          {plugins.length === 0 ? (
            <Text color="gray" role="status">
              Aucune extension intégrée disponible.
            </Text>
          ) : filtered.length === 0 ? (
            <Text color="gray" role="status">
              Aucune extension ne correspond à votre recherche.
            </Text>
          ) : (
            <PluginList.Root>
              {filtered.map((plugin) => (
                <PluginList.Item key={plugin.id}>
                  <PluginList.Header>
                    <Flex align="center" gap="2" wrap="wrap">
                      <PluginList.Title>{plugin.name}</PluginList.Title>
                      <Badge color="gray">
                        {plugin.sources.length} {plugin.sources.length === 1 ? 'source' : 'sources'}
                      </Badge>
                    </Flex>
                    <PluginList.Description>Identifiant : {plugin.id}</PluginList.Description>
                  </PluginList.Header>
                  <PluginList.Content>
                    {plugin.sources.length === 0 ? (
                      <Text color="gray" size="2">
                        Aucune source dans cette extension.
                      </Text>
                    ) : (
                      <SourceList.Root aria-label={`Sources de ${plugin.name}`}>
                        {plugin.sources.map((source) => (
                          <SourceList.Item
                            key={JSON.stringify([plugin.id, source.id])}
                            title={source.name}
                            language={source.language}
                          >
                            <SourceList.Actions aria-label={`Actions pour ${source.name}`}>
                              <IconButton size="2" variant="soft" asChild>
                                <Link
                                  to="/discover/$pluginId/$sourceId"
                                  params={{ pluginId: plugin.id, sourceId: source.id }}
                                  aria-label={`Parcourir ${source.name}`}
                                >
                                  <GlobeIcon size={18} aria-hidden="true" />
                                </Link>
                              </IconButton>
                            </SourceList.Actions>
                          </SourceList.Item>
                        ))}
                      </SourceList.Root>
                    )}
                  </PluginList.Content>
                </PluginList.Item>
              ))}
            </PluginList.Root>
          )}
        </RequestState>
      </PageSection>
    </Flex>
  );
}
