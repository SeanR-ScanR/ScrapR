import { createFileRoute } from '@tanstack/react-router';
import PageExtension from '@renderer/pages/PageExtension/PageExtension';

export const Route = createFileRoute('/extension')({
  component: PageExtension
});
