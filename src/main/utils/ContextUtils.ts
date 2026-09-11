import { ContextOf, EntityOf, Kind, Plugin } from '../pluginTypes';

export function getContextPath<Path extends readonly Kind[]>(context: ContextOf<Path>): Kind[] {
  if (!context?._parents) {
    return [];
  }
  return context._parents.map((p) => p.kind);
}

export function getDescriptor<Path extends readonly Kind[]>(
  rootDescriptor: Plugin['descriptors'],
  path: Path
): Plugin['descriptors'] | undefined {
  return path.reduce<any>((acc, cur) => acc?.[cur], rootDescriptor);
}

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
