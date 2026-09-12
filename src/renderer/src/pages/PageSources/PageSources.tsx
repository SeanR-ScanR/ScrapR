import { Box, Flex, IconButton, Select, Text } from '@radix-ui/themes';
import { GlobeIcon, SearchIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import * as SearchForm from '@renderer/components/SearchForm/SearchForm';
import * as SourceList from '@renderer/components/SourceList/SourceList';
import { usePlugins } from '@renderer/hooks/useRepository';
import { Link } from '@tanstack/react-router';

export default function PageSources(): ReactElement {
  const { items: plugins, loading, error, retry } = usePlugins();
  const sources = plugins.flatMap((plugin) =>
    plugin.sources.map((source) => ({ pluginId: plugin.id, source }))
  );
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const search = query.trim().toLocaleLowerCase();
  const languages = [...new Set(sources.map(({ source }) => source.language))].sort();
  const filtered = sources.filter(
    ({ source }) =>
      source.name.toLocaleLowerCase().includes(search) &&
      (language === 'all' || source.language === language)
  );

  return (
    <Flex direction="column" gap="6">
      <PageSection title="Sources">
        <Flex gap="3" wrap="wrap">
          <Box
            flexGrow="1"
            flexBasis="240px"
            maxWidth={{ initial: '100%', sm: '300px' }}
            minWidth="0"
          >
            <SearchForm.Root onSearch={setQuery}>
              <SearchForm.Input
                size="3"
                placeholder="Rechercher"
                aria-label="Rechercher une source"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              >
                <SearchForm.Slot>
                  <SearchIcon size={18} aria-hidden="true" />
                </SearchForm.Slot>
              </SearchForm.Input>
            </SearchForm.Root>
          </Box>
          <Select.Root size="3" value={language} onValueChange={setLanguage}>
            <Select.Trigger aria-label="Langue" />
            <Select.Content position="popper">
              <Select.Item value="all">Toutes les langues</Select.Item>
              {languages.filter(Boolean).map((value) => (
                <Select.Item key={value} value={value}>
                  {value}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </PageSection>
      <PageSection title="Disponibles">
        <RequestState
          loading={loading}
          error={error}
          onRetry={retry}
          loadingLabel="Chargement des sources..."
        >
          {sources.length === 0 ? (
            <Text color="gray" role="status">
              Aucune source disponible.
            </Text>
          ) : filtered.length === 0 ? (
            <Text color="gray" role="status">
              Aucune source ne correspond à vos filtres.
            </Text>
          ) : (
            <SourceList.Root>
              {filtered.map(({ pluginId, source }) => {
                return (
                  <SourceList.Item
                    key={JSON.stringify([pluginId, source.id])}
                    title={source.name}
                    language={source.language}
                  >
                    <SourceList.Actions aria-label={`Actions pour ${source.name}`}>
                      <IconButton size="2" variant="soft" asChild>
                        <Link
                          to="/explore/$pluginId/$sourceId"
                          params={{ pluginId, sourceId: source.id }}
                          aria-label={`Explorer ${source.name}`}
                        >
                          <GlobeIcon size={18} aria-hidden="true" />
                        </Link>
                      </IconButton>
                    </SourceList.Actions>
                  </SourceList.Item>
                );
              })}
            </SourceList.Root>
          )}
        </RequestState>
      </PageSection>
    </Flex>
  );
}
