# scrapr

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## System API

The API separates plugin definitions, domain operations, and Electron transport:

- `src/shared/pluginTypes.ts` defines descriptor schemas, inferred plugin types, and descriptor metadata. Operation names are derived from the operation schema; supported capabilities are fetched for the requested descriptor path.
- `src/main/utils/descriptorUtils.ts` provides descriptor traversal, capability discovery, suggestions, search, resource retrieval, and URL parsing. These functions accept a `Source` and have no Electron or repository dependency.
- `src/main/utils/sourceUtils.ts` provides source enumeration, metadata extraction, and plugin-qualified repository lookup. Source IDs must be unique within a plugin, not globally; ambiguous lookups fail rather than choosing a source silently.
- `src/shared/ipcTypes.ts` is the IPC contract registry. Each channel defines argument schemas and selects its result schema from validated arguments. Transport types are inferred from the registry, without channel-specific conditional types.
- `src/main/ipc/handle.ts` validates requests and results around typed handlers. IPC registrations only resolve dependencies and delegate to domain utilities.
- `src/renderer/src/services/ipcClient.ts` provides the matching typed, validated `invoke` function. UI code uses `repositoryClient` and `descriptorClient` rather than raw Electron calls.

Domain utilities retain kind-specific result inference:

```ts
const source = resolveSource(pluginId, sourceId, plugins);
const kinds = listDescriptors(source);
const operations = getDescriptorCapabilities(source, ['series', 'chapter']);
const series = await getDescriptorResource(source, [], 'series', seriesId);
const chapter = await getDescriptorResource(source, [series], 'chapter', chapterId);
```

Paths describe descriptor kinds; operation parents are full entities in ancestor order. A kind-only path cannot replace resource parents because plugins need their IDs and other context fields. Empty paths are valid for root discovery. Repeated kinds and paths continuing after a terminal descriptor are rejected. Domain operations and both IPC boundaries validate results against the selected kind and ancestor path.

Resource client methods preserve literal kinds and parent tuples through generic overloads. Dynamic parent arrays have conservative inferred result types, while their actual paths are still enforced at runtime. Raw `invoke` exposes the broader schema-inferred transport type; it does not duplicate resource-specific type logic.

`SourceMetadata.descriptors` contains root descriptor metadata (`kind` and supported `operations`), not just kind names. Plugin metadata includes this same source metadata. Root browsing reuses it directly; nested browsing calls `plugin.source.descriptor:list`, which returns the same descriptor metadata shape in a single request. `extractDescriptorMetadata` and `listDescriptorMetadata` provide the reusable domain implementation. Capabilities remain path-specific and can also be queried independently.

Source endpoints use the `plugin.source` prefix and require a plugin ID. Endpoints targeting a particular source also require its source ID. Resource endpoints, including search and suggestions, use `plugin.source.descriptor.resource:<operation>`.

To add an IPC endpoint, define its schemas in `IpcContracts`, register it with `handle`, and call it through `invoke`. Do not redeclare argument/result interfaces or bypass the validating wrappers.
