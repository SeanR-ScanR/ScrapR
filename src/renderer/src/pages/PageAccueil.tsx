import React from 'react';
import Card from '@renderer/components/Card';

const PageAccueil: React.FC = () => {
  const favorites: string[] = ['7 Princess', 'Sentai', 'Marchen', 'Aishiteru', 'Star Blossom'];

  return (
    <div className="content-area">
      <h2 className="section-title">Rip par URL</h2>
      <input type="text" className="generic-input" placeholder="" />

      <h2 className="section-title">Favoris</h2>
      <div className="cards-grid">
        {favorites.map((fav, index) => (
          <Card key={index} title={fav} />
        ))}
      </div>
    </div>
  );
};

export default PageAccueil;
