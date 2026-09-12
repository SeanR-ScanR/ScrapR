import React, { useEffect, useState } from 'react';
import DataTreeNode from './components/DataTreeNode';
import { createContext } from '@renderer/poc/utils/ContextUtils';

function PocApp(): React.JSX.Element {
  const [rootDescriptors, setRootDescriptors] = useState();

  useEffect(() => {
    window.electron.ipcRenderer.invoke('rootNodeKeys:get').then((r) => setRootDescriptors(r));
  }, []);

  if (!rootDescriptors) {
    return <></>;
  }

  return <DataTreeNode context={createContext()} tabs={rootDescriptors} />;
}

export default PocApp;
