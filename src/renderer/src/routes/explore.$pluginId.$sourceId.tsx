import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useRouter,
  useLocation
} from '@tanstack/react-router';
import { Text } from '@radix-ui/themes';
import { useEffect } from 'react';
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import PageExplore from '@renderer/pages/PageExplore/PageExplore';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import { repositoryQueries } from '@renderer/services/ipcQueries';
import { validateExploreSearch } from '@renderer/services/exploreNavigation';

export const Route = createFileRoute('/explore/$pluginId/$sourceId')({
  validateSearch: validateExploreSearch,
  loader: async ({ params, context: { queryClient } }): Promise<void> => {
    const plugins = await queryClient.query(repositoryQueries.listPlugins());
    const plugin = plugins.find((plugin) => plugin.id === params.pluginId);
    if (!plugin?.sources.some((source) => source.id === params.sourceId)) {
      throw new Error('This source does not belong to the requested plugin.');
    }
    await queryClient.query(repositoryQueries.getSource(params.pluginId, params.sourceId));
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
  const { reset } = useQueryErrorResetBoundary();
  useEffect(() => {
    reset();
  }, [reset]);
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
  const { pluginId, sourceId } = Route.useParams();
  const sourceQuery = useSuspenseQuery(repositoryQueries.getSource(pluginId, sourceId));
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const location = useLocation();
  return (
    <RequestState
      loading={false}
      fetching={sourceQuery.isFetching}
      hasData
      error={sourceQuery.error?.message ?? ''}
      onRetry={() => void sourceQuery.refetch()}
      loadingLabel="Chargement de la source..."
    >
      <PageExplore
        key={JSON.stringify([location.href, location.state.__TSR_key])}
        pluginId={pluginId}
        source={sourceQuery.data}
        search={search}
        navigate={(search) => {
          void navigate({ search });
        }}
      />
    </RequestState>
  );
}
