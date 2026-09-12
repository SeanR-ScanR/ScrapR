import { Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import type { AnyEntity, AnyPreview, DescriptorMetadata } from '@shared/pluginTypes';
import { DescriptorKindSchema } from '@shared/pluginTypes';
import * as ResourceDetails from '@renderer/components/ResourceDetails/ResourceDetails';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { ResourceGrid } from '@renderer/components/ResourceGrid/ResourceGrid';
import { descriptorLabels, resourceTitle } from '@renderer/utils/resourcePresentation';

export interface ResourceViewProps {
  resource: AnyEntity;
  descriptors: DescriptorMetadata[];
  busy?: boolean;
  onOpen: (entry: AnyPreview) => void;
}

export function ResourceView({
  resource,
  descriptors,
  busy,
  onOpen
}: ResourceViewProps): ReactElement {
  return (
    <ResourceDetails.Root>
      <ResourceDetails.Title>{resourceTitle(resource)}</ResourceDetails.Title>
      {'date' in resource && (
        <ResourceDetails.Metadata>
          <Text>{resource.date}</Text>
        </ResourceDetails.Metadata>
      )}
      {'description' in resource && (
        <ResourceDetails.Description>{resource.description}</ResourceDetails.Description>
      )}
      {resource.kind === 'page' ? (
        <ResourceDetails.Image src={resource.dataUri} alt={resourceTitle(resource)} />
      ) : (
        <>
          {DescriptorKindSchema.options.map((kind) => {
            const entries = resource.has?.[kind];
            if (!entries) return null;
            return (
              <PageSection key={kind} title={descriptorLabels[kind]}>
                {entries.length ? (
                  <ResourceGrid
                    entries={entries}
                    canOpen={descriptors.some(
                      (descriptor) =>
                        descriptor.kind === kind && descriptor.operations.includes('get')
                    )}
                    busy={busy}
                    onOpen={onOpen}
                  />
                ) : (
                  <Text color="gray">
                    Aucune ressource disponible dans la catégorie "{descriptorLabels[kind]}".
                  </Text>
                )}
              </PageSection>
            );
          })}
          {!Object.keys(resource.has ?? {}).length && (
            <Text color="gray">Cette ressource ne contient aucune autre ressource.</Text>
          )}
        </>
      )}
    </ResourceDetails.Root>
  );
}
