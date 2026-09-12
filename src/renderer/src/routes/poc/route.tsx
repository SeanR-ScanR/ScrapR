import { createFileRoute } from '@tanstack/react-router';
import PocApp from '@renderer/poc/PocApp';

export const Route = createFileRoute('/poc')({
  component: PocApp
});
