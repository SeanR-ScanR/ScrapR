import React from 'react';
import { Grid, Heading, TextField } from '@radix-ui/themes';
import AppTheme from '@renderer/components/AppTheme';
import Card from '@renderer/components/Card';

const PageAccueil: React.FC = () => {
  const favorites: string[] = ['7 Princess', 'Sentai', 'Marchen', 'Aishiteru', 'Star Blossom'];

  return (
    <AppTheme>
      <main className="content-area">
        <Heading as="h2" size="3" weight="medium" className="section-title" id="rip-url-title">
          Rip par URL
        </Heading>
        <TextField.Root
          size="3"
          variant="surface"
          className="url-input"
          aria-labelledby="rip-url-title"
        />

        <Heading as="h2" size="3" weight="medium" className="section-title">
          Favoris
        </Heading>
        <Grid className="cards-grid">
          {favorites.map((fav) => (
            <Card key={fav} title={fav} />
          ))}
        </Grid>
      </main>
    </AppTheme>
  );
};

export default PageAccueil;
