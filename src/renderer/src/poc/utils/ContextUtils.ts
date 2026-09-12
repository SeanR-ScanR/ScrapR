import { ContextOf, EntityOf, Kind } from '@shared/pluginTypes';

export function createContext() {
  return {
    _parents: []
  } as unknown as ContextOf<Kind[]>;
}

export function withParent<Path extends readonly Kind[], This extends Kind>(
  context: ContextOf<Path>,
  entity: EntityOf<This>
): ContextOf<[...Path, This]> {
  return {
    ...context,
    _parents: [...context._parents, entity] as ContextOf<[...Path, This]>['_parents'],
    [entity.kind]: entity
  } as ContextOf<[...Path, This]>;
}
