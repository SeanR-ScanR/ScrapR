import { Theme } from '@radix-ui/themes';
import type { ReactElement } from 'react';

// Separate boundaries keep the POC outside the application's theme context.
export default function AppTheme({ children }: { children: ReactElement }): ReactElement {
  return (
    <Theme
      asChild
      appearance="dark"
      accentColor="violet"
      grayColor="slate"
      radius="small"
      hasBackground={false}
      className="scrapr-theme"
    >
      {children}
    </Theme>
  );
}
