import { createFileRoute } from '@tanstack/react-router';
import PageSettings from '@renderer/pages/PageSettings/PageSettings';

export const Route = createFileRoute('/settings')({
  component: PageSettings
});
