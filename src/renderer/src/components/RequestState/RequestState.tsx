import { Button, Flex, Text } from '@radix-ui/themes';
import type { ReactElement, ReactNode } from 'react';

export interface RequestStateProps {
  loading: boolean;
  fetching?: boolean;
  hasData?: boolean;
  error: string;
  onRetry: () => void;
  loadingLabel?: string;
  children: ReactNode;
}

export function RequestState({
  loading,
  fetching = false,
  hasData = false,
  error,
  onRetry,
  loadingLabel = 'Chargement...',
  children
}: RequestStateProps): ReactElement {
  if (loading) return <Text role="status">{loadingLabel}</Text>;
  return (
    <>
      {error && (
        <Flex direction="column" gap="2" align="start">
          <Text role="alert" color="red">
            {error}
          </Text>
          <Button onClick={onRetry} disabled={fetching}>
            Réessayer
          </Button>
        </Flex>
      )}
      {fetching && <Text role="status">{loadingLabel}</Text>}
      {(!error || hasData) && children}
    </>
  );
}
