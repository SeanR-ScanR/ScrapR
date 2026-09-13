import { createFileRoute, type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import PageDiscover from '@renderer/pages/PageDiscover/PageDiscover';
import { PageSection } from '@renderer/components/PageSection/PageSection';
import { RequestState } from '@renderer/components/RequestState/RequestState';
import { LoadingState } from '@renderer/components/LoadingState/LoadingState';
import { repositoryQueries } from '@renderer/services/ipcQueries';
import { validateDiscoverSearch } from '@renderer/services/discoverNavigation';

export const Route = createFileRoute('/discover/$pluginId/$sourceId')({
  validateSearch: validateDiscoverSearch,
  loader: async ({ params, context: { queryClient } }): Promise<void> => {
    const plugins = await queryClient.query(repositoryQueries.listPlugins());
    const plugin = plugins.find((plugin) => plugin.id === params.pluginId);
    if (!plugin?.sources.some((source) => source.id === params.sourceId)) {
      throw new Error('This source does not belong to the requested plugin.');
    }
    await queryClient.query(repositoryQueries.getSource(params.pluginId, params.sourceId));
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => (
    <PageSection title="Parcourir">
      <LoadingState label="Chargement de la source..." />
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
    <PageSection title="Parcourir">
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
  return (
    <RequestState
      loading={false}
      fetching={sourceQuery.isFetching}
      hasData
      error={sourceQuery.error?.message ?? ''}
      onRetry={() => void sourceQuery.refetch()}
      loadingLabel="Actualisation de la source..."
    >
      <PageDiscover
        key={JSON.stringify([pluginId, sourceId, search])}
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
