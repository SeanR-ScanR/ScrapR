import { Theme } from '@radix-ui/themes';
import type { ReactElement } from 'react';

export default function AppTheme({ children }: { children: ReactElement }): ReactElement {
  return (
    <Theme
      asChild
      appearance="dark"
      accentColor="violet"
      grayColor="slate"
      radius="medium"
      hasBackground={false}
      className="scrapr-theme"
    >
      {children}
    </Theme>
  );
}
