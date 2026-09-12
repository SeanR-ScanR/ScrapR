import { Heading, Text } from '@radix-ui/themes';
import type { ReactElement } from 'react';

export default function PageExtension(): ReactElement {
  return (
    <>
      <Heading as="h2">Extension</Heading>
      <Text color="gray">La gestion des extensions n&apos;est pas encore disponible.</Text>
    </>
  );
}
