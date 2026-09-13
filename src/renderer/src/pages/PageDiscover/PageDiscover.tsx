import { Box, Tabs, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { DescriptorBrowser } from '@renderer/components/DescriptorBrowser/DescriptorBrowser';
import { descriptorLabels } from '@renderer/utils/resourcePresentation';
import type { SourceMetadata } from '@shared/pluginTypes';
import type { DiscoverSearch } from '@renderer/services/discoverNavigation';

export default function PageDiscover({
  pluginId,
  source,
  search,
  navigate
}: {
  pluginId: string;
  source: SourceMetadata;
  search: DiscoverSearch;
  navigate: (search: DiscoverSearch) => void;
}): ReactElement {
  const { descriptors } = source;
  const selected = descriptors.find(({ kind }) => kind === search.kind) ?? descriptors[0];

  return (
    <PageSection title={`Parcourir: ${source.name}`}>
      {descriptors.length ? (
        <Tabs.Root
          value={selected.kind}
          onValueChange={(value) => {
            const descriptor = descriptors.find(({ kind }) => kind === value);
            if (descriptor) navigate({ kind: descriptor.kind });
          }}
        >
          <Box overflowX="auto">
            <Tabs.List aria-label="Types de ressources disponibles">
              {descriptors.map(({ kind }) => (
                <Tabs.Trigger key={kind} value={kind}>
                  {descriptorLabels[kind]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Box>
          {descriptors
            .filter(({ kind }) => kind === selected.kind)
            .map((descriptor) => (
              <Tabs.Content key={descriptor.kind} value={descriptor.kind}>
                <DescriptorBrowser
                  pluginId={pluginId}
                  source={source}
                  descriptor={descriptor}
                  search={search}
                  navigate={navigate}
                />
              </Tabs.Content>
            ))}
        </Tabs.Root>
      ) : (
        <Text>Cette source ne propose aucun type de ressource à parcourir.</Text>
      )}
    </PageSection>
  );
}
