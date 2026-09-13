import { Button, Flex } from '@radix-ui/themes';
import { DescriptorBrowser } from '@renderer/hooks/useDescriptorBrowser';
import { JSX } from 'react';

export function BrowserRetry(props: { browser: DescriptorBrowser }): JSX.Element {
  return (
    <Flex direction="column" gap="2">
      {props.browser.detailError && (
        <Button variant="soft" onClick={props.browser.retryResource} style={{ alignSelf: 'start' }}>
          Reessayer
        </Button>
      )}
      <Button variant="soft" onClick={() => props.browser.back(0)} style={{ alignSelf: 'start' }}>
        Retour aux resultats
      </Button>
    </Flex>
  );
}
