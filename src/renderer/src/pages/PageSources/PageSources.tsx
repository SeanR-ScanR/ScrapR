import { Box, Flex, Grid, IconButton, Select, TextField } from '@radix-ui/themes';
import { SearchIcon, SettingsIcon, TrashIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import * as SourceList from '@renderer/components/SourceList/SourceList';

// Placeholder records until the source catalogue is connected.
const sources = Array.from({ length: 5 }, (_, index) => ({
  id: `comic-days-${index + 1}`,
  title: 'Comic Days',
  language: 'Japonais'
}));

const groups = [
  { title: 'Plus récente', sources: sources.slice(0, 2) },
  { title: 'Tous', sources }
];

export default function PageSources(): ReactElement {
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
            <TextField.Root size="3" placeholder="Rechercher" aria-label="Rechercher une source">
              <TextField.Slot>
                <SearchIcon size={18} aria-hidden="true" />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Grid
            columns={{ initial: '1', xs: '2' }}
            gap="3"
            flexGrow={{ initial: '1', sm: '0' }}
            minWidth="0"
          >
            <Select.Root size="3" defaultValue="style">
              <Select.Trigger aria-label="Style" />
              <Select.Content position="popper">
                <Select.Item value="style">Style</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root size="3" defaultValue="langue">
              <Select.Trigger aria-label="Langue" />
              <Select.Content position="popper">
                <Select.Item value="langue">Langue</Select.Item>
              </Select.Content>
            </Select.Root>
          </Grid>
        </Flex>
      </PageSection>
      {groups.map((group) => (
        <PageSection key={group.title} title={group.title}>
          <SourceList.Root aria-label={group.title}>
            {group.sources.map((source) => (
              <SourceList.Item key={source.id} title={source.title} language={source.language}>
                <SourceList.Actions aria-label={`Actions pour ${source.title}`}>
                  <IconButton
                    size="2"
                    variant="ghost"
                    color="gray"
                    disabled
                    aria-label={`Supprimer ${source.title}`}
                  >
                    <TrashIcon size={18} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    size="2"
                    variant="ghost"
                    color="gray"
                    disabled
                    aria-label={`Paramètres de ${source.title}`}
                  >
                    <SettingsIcon size={18} aria-hidden="true" />
                  </IconButton>
                </SourceList.Actions>
              </SourceList.Item>
            ))}
          </SourceList.Root>
        </PageSection>
      ))}
    </Flex>
  );
}
