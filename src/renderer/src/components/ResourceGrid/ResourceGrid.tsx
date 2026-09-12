import { Button, Flex, Grid, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import type { AnyPreview } from '@shared/pluginTypes';
import * as ResourceCard from '@renderer/components/ResourceCard/ResourceCard';
import { resourceTitle } from '@renderer/utils/resourcePresentation';

export interface ResourceGridProps {
  entries: AnyPreview[];
  canOpen: boolean;
  busy?: boolean;
  onOpen: (entry: AnyPreview) => void;
}

export function ResourceGrid({ entries, canOpen, busy, onOpen }: ResourceGridProps): ReactElement {
  return (
    <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="3">
      {entries.map((entry, index) => (
        <ResourceCard.Root key={`${entry.kind}:${entry.id}:${index}`}>
          <Flex direction="column" gap="3" style={{ overflowWrap: 'anywhere' }}>
            <ResourceCard.Title>{resourceTitle(entry)}</ResourceCard.Title>
            {'date' in entry && <ResourceCard.Description>{entry.date}</ResourceCard.Description>}
            <ResourceCard.Actions>
              {canOpen ? (
                <Button
                  variant="soft"
                  disabled={busy}
                  onClick={() => onOpen(entry)}
                  aria-label={`Voir les détails : ${resourceTitle(entry)}`}
                >
                  Voir les détails
                </Button>
              ) : (
                <Text size="2" color="gray">
                  Les détails ne sont pas disponibles pour cette source.
                </Text>
              )}
            </ResourceCard.Actions>
          </Flex>
        </ResourceCard.Root>
      ))}
    </Grid>
  );
}
