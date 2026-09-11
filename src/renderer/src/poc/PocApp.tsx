import React, { useEffect, useState } from 'react';
import DataTreeNode from './components/DataTreeNode';
import { createContext } from '@renderer/poc/utils/ContextUtils';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './assets/main.css';

function PocApp(): React.JSX.Element {
  const [rootDescriptors, setRootDescriptors] = useState();

  useEffect(() => {
    window.electron.ipcRenderer.invoke('rootNodeKeys:get').then((r) => setRootDescriptors(r));
  }, []);

  if (!rootDescriptors) {
    return <></>;
  }

  return (
    <Theme appearance="dark" accentColor="crimson" style={{ overflow: 'scroll', width: '100%' }}>
      <DataTreeNode
        context={createContext()}
        tabs={rootDescriptors}
        // prefill={{ magazine: [{ id: 28663, title: '勇者遺族' }] }}
      ></DataTreeNode>
    </Theme>
  );
}

export default PocApp;
