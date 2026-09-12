import React from 'react';
import { Box, Tabs } from '@radix-ui/themes';
import MagazineNode from '@renderer/poc/components/MagazineNode';
import ChapterNode from '@renderer/poc/components/ChapterNode';
import PageNode from '@renderer/poc/components/PageNode';
import { ContextOf, Kind } from '../../../../main/plugins/pluginTypes';
import { Descriptors } from '../../../../main/plugins/pluginGlobals';

function DataTreeNode({
  context,
  tabs,
  prefill = {}
}: {
  context: ContextOf<Kind[]>;
  tabs: Kind[];
  prefill?: Partial<Record<Kind, any[]>>;
}): React.JSX.Element {
  return (
    <Tabs.Root defaultValue={tabs[0]}>
      <Tabs.List>
        {tabs.map((key) => (
          <Tabs.Trigger value={key}>{key}</Tabs.Trigger>
        ))}
      </Tabs.List>

      <Box pt="3">
        {tabs.map((key) => (
          <Tabs.Content value={key}>
            {key === Descriptors.MAGAZINE ? (
              <MagazineNode context={context} prefill={prefill[key]} />
            ) : null}
            {key === Descriptors.CHAPTER ? (
              <ChapterNode context={context} prefill={prefill[key]} />
            ) : null}
            {key === Descriptors.PAGE ? (
              <PageNode context={context} prefill={prefill[key]} />
            ) : null}
          </Tabs.Content>
        ))}
      </Box>
    </Tabs.Root>
  );
}

export default DataTreeNode;
