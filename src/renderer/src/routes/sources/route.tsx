import { createFileRoute } from '@tanstack/react-router';
import PageSources from '@renderer/pages/PageSources/PageSources';

export const Route = createFileRoute('/sources')({
  component: PageSources
});
