import { Button, Flex, Text } from '@radix-ui/themes';
import type { ReactElement, ReactNode } from 'react';
import { LoadingState } from '@renderer/components/LoadingState/LoadingState';

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
  if (loading || fetching) return <LoadingState label={loadingLabel} />;
  return (
    <>
      {error && (
        <Flex direction="column" gap="2" align="start">
          <Text role="alert" color="red">
            {error}
          </Text>
          <Button onClick={onRetry}>Réessayer</Button>
        </Flex>
      )}
      {(!error || hasData) && children}
    </>
  );
}
