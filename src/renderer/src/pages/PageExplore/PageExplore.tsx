import { Flex } from '@radix-ui/themes';
import { ReactElement, useEffect, useState } from 'react';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { Kind, PluginMetadata } from '@shared/pluginTypes';

export default function PageExplore({ source }: { source: PluginMetadata }): ReactElement {
  const [rootDescriptors, setRootDescriptors] = useState<Kind[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('source.descriptor.root.list:get', source.name)
      .then(setRootDescriptors);
  }, []);

  return (
    <Flex direction="column" gap="6">
      <PageSection title={'Explore: ' + source.name}>
        {rootDescriptors.map((descriptor) => (
          <Flex gap="3" wrap="wrap">
            {descriptor}
          </Flex>
        ))}
      </PageSection>
    </Flex>
  );
}
