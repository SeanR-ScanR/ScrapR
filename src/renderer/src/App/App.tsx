import type { ReactElement } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';
import * as AppShell from '@renderer/components/shared/AppShell/AppShell';
import { SidebarNavigation } from '@renderer/components/SidebarNavigation/SidebarNavigation';
import TopBar from '@renderer/components/TopBar/TopBar';

export default function App(): ReactElement {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <AppShell.Root>
      <AppShell.Header>
        <TopBar />
      </AppShell.Header>
      <AppShell.Body>
        <AppShell.Sidebar>
          <SidebarNavigation />
        </AppShell.Sidebar>
        <AppShell.Content key={pathname}>
          <Outlet />
        </AppShell.Content>
      </AppShell.Body>
    </AppShell.Root>
  );
}
