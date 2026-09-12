import { Box, Flex, Grid, IconButton, Select, TextField } from '@radix-ui/themes';
import { SearchIcon, SettingsIcon, TrashIcon } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import * as SourceList from '@renderer/components/SourceList/SourceList';
import { PluginMetadata } from '@shared/pluginTypes';

export default function PageSources(): ReactElement {
  const [sources, setSources] = useState<PluginMetadata[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.invoke('sources:get').then(setSources);
  }, []);

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
      <PageSection title={'Installées'}>
        <SourceList.Root>
          {sources.map((source) => (
            <SourceList.Item key={source.name} title={source.name} language={source.language}>
              <SourceList.Actions aria-label={`Actions pour ${source.name}`}>
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  disabled
                  aria-label={`Supprimer ${source.name}`}
                >
                  <TrashIcon size={18} aria-hidden="true" />
                </IconButton>
                <IconButton
                  size="2"
                  variant="ghost"
                  color="gray"
                  disabled
                  aria-label={`Paramètres de ${source.name}`}
                >
                  <SettingsIcon size={18} aria-hidden="true" />
                </IconButton>
              </SourceList.Actions>
            </SourceList.Item>
          ))}
        </SourceList.Root>
      </PageSection>
    </Flex>
  );
}
