import { Flex, Spinner, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';

interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function LoadingState({
  label = 'Chargement...',
  compact = false
}: LoadingStateProps): ReactElement {
  return (
    <Flex
      direction={compact ? 'row' : 'column'}
      align="center"
      justify={compact ? 'start' : 'center'}
      gap="3"
      py={compact ? '2' : '8'}
      role="status"
      aria-live="polite"
    >
      <Spinner size={compact ? '2' : '3'} aria-hidden="true" />
      <Text size="2" color="gray">
        {label}
      </Text>
    </Flex>
  );
}
