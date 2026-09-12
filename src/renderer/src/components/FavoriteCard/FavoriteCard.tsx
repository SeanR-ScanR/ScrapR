import { AspectRatio, Card, Flex, Inset, Text } from '@radix-ui/themes';
import { ImageOffIcon } from 'lucide-react';
import type { ReactElement } from 'react';

type FavoriteCardProps = {
  title: string;
};

export function FavoriteCard({ title }: FavoriteCardProps): ReactElement {
  return (
    <Card asChild size="1">
      <li>
        <Inset clip="padding-box" side="top" mb="3">
          <AspectRatio ratio={3 / 4}>
            <Flex
              align="center"
              justify="center"
              height="100%"
              style={{ background: 'var(--gray-4)', color: 'var(--gray-9)' }}
            >
              <ImageOffIcon size={24} aria-hidden="true" />
            </Flex>
          </AspectRatio>
        </Inset>
        <Text as="p" size="2" weight="medium" align="center">
          {title}
        </Text>
      </li>
    </Card>
  );
}
