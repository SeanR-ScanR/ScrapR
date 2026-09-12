import { Flex, Grid, TextField } from '@radix-ui/themes';
import { LinkIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { FavoriteCard } from '@renderer/components/FavoriteCard/FavoriteCard';
import { PageSection } from '@renderer/components/PageSection/PageSection';

const favorites = ['7 Princess', 'Sentai', 'Marchen', 'Aishiteru', 'Star Blossom'];

export default function PageAccueil(): ReactElement {
  return (
    <Flex direction="column" gap="6">
      <PageSection title="Extraction par URL">
        <TextField.Root size="3" type="url" aria-label="Extraction par URL">
          <TextField.Slot>
            <LinkIcon size={18} aria-hidden="true" />
          </TextField.Slot>
        </TextField.Root>
      </PageSection>
      <PageSection title="Favoris">
        <Grid asChild columns="repeat(auto-fill, minmax(min(112px, 100%), 1fr))" gap="4">
          <ul aria-label="Favoris">
            {favorites.map((title) => (
              <FavoriteCard key={title} title={title} />
            ))}
          </ul>
        </Grid>
      </PageSection>
    </Flex>
  );
}
