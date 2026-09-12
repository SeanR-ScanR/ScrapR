import { Box, Tabs, Text } from '@radix-ui/themes';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { DescriptorBrowser } from '@renderer/components/DescriptorBrowser/DescriptorBrowser';
import { descriptorLabels } from '@renderer/utils/resourcePresentation';
import * as Breadcrumbs from '@renderer/components/Breadcrumbs/Breadcrumbs';
import type { SourceMetadata } from '@shared/pluginTypes';

export default function PageExplore({
  pluginId,
  source
}: {
  pluginId: string;
  source: SourceMetadata;
}): ReactElement {
  const { descriptors } = source;

  return (
    <PageSection title={`Explorer : ${source.name}`}>
      <Link to="/sources">Sources</Link>
      {descriptors.length ? (
        <Tabs.Root defaultValue={descriptors[0].kind}>
          <Box overflowX="auto">
            <Tabs.List aria-label="Types de ressources disponibles">
              {descriptors.map(({ kind }) => (
                <Tabs.Trigger key={kind} value={kind}>
                  {descriptorLabels[kind]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Box>
          {descriptors.map((descriptor) => (
            <Tabs.Content key={descriptor.kind} value={descriptor.kind}>
              <DescriptorBrowser
                pluginId={pluginId}
                source={source}
                descriptor={descriptor}
                breadcrumbs={
                  <>
                    <Breadcrumbs.Item>
                      <Breadcrumbs.Link asChild>
                        <Link to="/sources">Sources</Link>
                      </Breadcrumbs.Link>
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Separator />
                  </>
                }
              />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      ) : (
        <Text>Cette source ne propose aucun type de ressource à explorer.</Text>
      )}
    </PageSection>
  );
}
