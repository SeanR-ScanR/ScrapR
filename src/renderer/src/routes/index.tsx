import { createFileRoute } from '@tanstack/react-router';
import PageAccueil from '@renderer/pages/PageAccueil/PageAccueil';

export const Route = createFileRoute('/')({
  component: PageAccueil
});
