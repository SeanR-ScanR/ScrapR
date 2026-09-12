import { Heading, Text } from '@radix-ui/themes';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export default function PageNotFound(): ReactElement {
  return (
    <>
      <Heading as="h2">Page introuvable</Heading>
      <Text>Cette page n&apos;existe pas.</Text>
      <Link to="/">Retour a l&apos;accueil</Link>
    </>
  );
}
