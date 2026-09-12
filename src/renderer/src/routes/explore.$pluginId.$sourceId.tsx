import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
  useLocation
} from '@tanstack/react-router';
import { Text } from '@radix-ui/themes';
import PageExplore from '@renderer/pages/PageExplore/PageExplore';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import type { SourceMetadata } from '@shared/pluginTypes';
import { repositoryClient } from '@renderer/services/repositoryClient';
import { validateExploreSearch } from '@renderer/services/exploreNavigation';

export const Route = createFileRoute('/explore/$pluginId/$sourceId')({
  validateSearch: validateExploreSearch,
  loader: async ({ params }): Promise<SourceMetadata> => {
    const plugins = await repositoryClient.listPlugins();
    const plugin = plugins.find((plugin) => plugin.id === params.pluginId);
    if (!plugin?.sources.some((source) => source.id === params.sourceId)) {
      throw new Error('This source does not belong to the requested plugin.');
    }
    return repositoryClient.getSource(params.pluginId, params.sourceId);
  },
  pendingComponent: () => (
    <PageSection title="Explorer">
      <Text role="status">Chargement de la source...</Text>
    </PageSection>
  ),
  errorComponent: ExploreError,
  component: ExploreRoute
});

function ExploreError({ error }: ErrorComponentProps): React.JSX.Element {
  const router = useRouter();
  return (
    <PageSection title="Explorer">
      <Link to="/sources">Sources</Link>
      <RequestState
        loading={false}
        error={error instanceof Error ? error.message : String(error)}
        onRetry={() => void router.invalidate()}
      >
        {null}
      </RequestState>
    </PageSection>
  );
}

function ExploreRoute(): React.JSX.Element {
  const source = Route.useLoaderData();
  const { pluginId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const location = useLocation();
  return (
    <PageExplore
      key={JSON.stringify([location.href, location.state.__TSR_key])}
      pluginId={pluginId}
      source={source}
      search={search}
      navigate={(search) => {
        void navigate({ search });
      }}
    />
  );
}
