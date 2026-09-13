import { Box, Flex, Select, Text } from '@radix-ui/themes';
import { SearchIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { PageSection } from '@renderer/components/shared/PageSection/PageSection';
import { RequestState } from '@renderer/components/shared/RequestState/RequestState';
import * as SearchForm from '@renderer/components/shared/SearchForm/SearchForm';
import * as SourceList from '@renderer/components/shared/SourceList/SourceList';
import { usePlugins } from '@renderer/hooks/useRepository';
import SimpleLink from '@renderer/components/shared/SimpleLink/SimpleLink';

export default function PageSources(): ReactElement {
  const { items: plugins, loading, fetching, hasData, error, retry } = usePlugins();
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
          fetching={fetching}
          hasData={hasData}
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
                  <SimpleLink
                    to="/discover/$pluginId/$sourceId"
                    params={{ pluginId, sourceId: source.id }}
                    aria-label={`Parcourir ${source.name}`}
                    key={JSON.stringify([pluginId, source.id])}
                  >
                    <SourceList.Item
                      key={JSON.stringify([pluginId, source.id])}
                      title={source.name}
                      language={source.language}
                    >
                      <SourceList.Actions
                        aria-label={`Actions pour ${source.name}`}
                      ></SourceList.Actions>
                    </SourceList.Item>
                  </SimpleLink>
                );
              })}
            </SourceList.Root>
          )}
        </RequestState>
      </PageSection>
    </Flex>
  );
}
