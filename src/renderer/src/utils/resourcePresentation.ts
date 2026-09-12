import type { AnyPreview, DescriptorKind } from '@shared/pluginTypes';

export const descriptorLabels: Record<DescriptorKind, string> = {
  magazine: 'Magazines',
  release: 'Parutions',
  series: 'Séries',
  chapter: 'Chapitres',
  page: 'Pages'
};

export function resourceTitle(resource: AnyPreview): string {
  return 'title' in resource ? resource.title : `Page ${resource.id}`;
}
