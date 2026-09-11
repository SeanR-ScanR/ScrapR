import React from 'react';
import { Flex, Heading, Select, TextField } from '@radix-ui/themes';
import AppTheme from '@renderer/components/AppTheme';
import ListItem from '@renderer/components/ListItem';

const PageSources: React.FC = () => {
  // Simulation de données
  const sources: Array<{ title: string; lang: string }> = Array(5).fill({
    title: 'Comic Days',
    lang: 'Japonais'
  });

  return (
    <AppTheme>
      <main className="content-area">
        <Heading as="h2" size="3" weight="medium" className="section-title">
          Sources
        </Heading>

        <Flex wrap="wrap" className="filters-row">
          <TextField.Root
            size="3"
            variant="surface"
            className="source-search"
            placeholder="Rechercher"
            aria-label="Rechercher une source"
          />
          <Select.Root size="3" defaultValue="style">
            <Select.Trigger variant="surface" className="source-filter" aria-label="Style" />
            <Select.Content className="scrapr-theme" position="popper">
              <Select.Item value="style">Style</Select.Item>
            </Select.Content>
          </Select.Root>
          <Select.Root size="3" defaultValue="langue">
            <Select.Trigger variant="surface" className="source-filter" aria-label="Langue" />
            <Select.Content className="scrapr-theme" position="popper">
              <Select.Item value="langue">Langue</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        <Heading
          as="h2"
          size="3"
          weight="medium"
          className="section-title"
          id="recent-sources-title"
        >
          Plus récente
        </Heading>
        <Flex asChild direction="column" className="list-container">
          <ul aria-labelledby="recent-sources-title">
            <ListItem title="Comic Days" lang="Japonais" />
            <ListItem title="Comic Days" lang="Japonais" />
          </ul>
        </Flex>

        <Heading as="h2" size="3" weight="medium" className="section-title" id="all-sources-title">
          Tous
        </Heading>
        <Flex asChild direction="column" className="list-container">
          <ul aria-labelledby="all-sources-title">
            {sources.map((src, index) => (
              <ListItem key={index} title={src.title} lang={src.lang} />
            ))}
          </ul>
        </Flex>
      </main>
    </AppTheme>
  );
};

export default PageSources;
