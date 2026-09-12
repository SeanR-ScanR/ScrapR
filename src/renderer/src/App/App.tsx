import { useState, type ReactElement } from 'react';
import * as AppShell from '@renderer/components/AppShell/AppShell';
import {
  SidebarNavigation,
  type PageId
} from '@renderer/components/SidebarNavigation/SidebarNavigation';
import TopBar from '@renderer/components/TopBar/TopBar';
import PageAccueil from '@renderer/pages/PageAccueil/PageAccueil';
import PageSources from '@renderer/pages/PageSources/PageSources';
import PocApp from '@renderer/poc/PocApp';

export default function App(): ReactElement {
  const [activePage, setActivePage] = useState<PageId>('accueil');

  return (
    <AppShell.Root>
      <AppShell.Header>
        <TopBar />
      </AppShell.Header>
      <AppShell.Body>
        <AppShell.Sidebar>
          <SidebarNavigation value={activePage} onValueChange={setActivePage} />
        </AppShell.Sidebar>
        {activePage === 'poc' ? (
          <PocApp />
        ) : (
          <AppShell.Content key={activePage}>
            {activePage === 'accueil' && <PageAccueil />}
            {activePage === 'sources' && <PageSources />}
          </AppShell.Content>
        )}
      </AppShell.Body>
    </AppShell.Root>
  );
}
