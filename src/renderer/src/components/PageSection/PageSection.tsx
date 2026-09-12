import { Flex, Heading } from '@radix-ui/themes';
import { useId, type ReactElement, type ReactNode } from 'react';

type PageSectionProps = {
  title: string;
  children: ReactNode;
};

export function PageSection({ title, children }: PageSectionProps): ReactElement {
  const titleId = useId();

  return (
    <Flex asChild direction="column" gap="4">
      <section aria-labelledby={titleId}>
        <Heading as="h2" size="4" id={titleId}>
          {title}
        </Heading>
        {children}
      </section>
    </Flex>
  );
}
