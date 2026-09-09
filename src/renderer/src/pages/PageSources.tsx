import React from 'react';
import ListItem from '@renderer/components/ListItem';

const PageSources: React.FC = () => {
  // Simulation de données
  const sources: Array<{ title: string; lang: string }> = Array(5).fill({
    title: 'Comic Days',
    lang: 'Japonais'
  });

  return (
    <div className="content-area">
      <h2 className="section-title">Sources</h2>

      <div className="filters-row">
        <input type="text" className="generic-input" placeholder="Rechercher" />
        <select className="generic-select">
          <option>Style</option>
        </select>
        <select className="generic-select">
          <option>Langue</option>
        </select>
      </div>

      <h2 className="section-title">Plus récente</h2>
      <div className="list-container">
        <ListItem title="Comic Days" lang="Japonais" />
        <ListItem title="Comic Days" lang="Japonais" />
      </div>

      <h2 className="section-title">Tous</h2>
      <div className="list-container">
        {sources.map((src, index) => (
          <ListItem key={index} title={src.title} lang={src.lang} />
        ))}
      </div>
    </div>
  );
};

export default PageSources;
