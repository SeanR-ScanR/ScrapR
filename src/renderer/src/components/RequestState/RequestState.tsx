import { Button, Flex, Text } from '@radix-ui/themes';
import type { ReactElement, ReactNode } from 'react';

export interface RequestStateProps {
  loading: boolean;
  error: string;
  onRetry: () => void;
  loadingLabel?: string;
  children: ReactNode;
}

export function RequestState({
  loading,
  error,
  onRetry,
  loadingLabel = 'Chargement...',
  children
}: RequestStateProps): ReactElement {
  if (loading) return <Text role="status">{loadingLabel}</Text>;
  if (error)
    return (
      <Flex direction="column" gap="2" align="start">
        <Text role="alert" color="red">
          {error}
        </Text>
        <Button onClick={onRetry}>Réessayer</Button>
      </Flex>
    );
  return <>{children}</>;
}
