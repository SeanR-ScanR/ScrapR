import React, { useState } from 'react';
import './assets/main.css';
import PageAccueil from '@renderer/pages/PageAccueil';
import PageSources from '@renderer/pages/PageSources';
import TopBar from '@renderer/components/TopBar';
import NavItem from '@renderer/components/NavItem';
import PocApp from '@renderer/poc/PocApp';
import {
  FlaskConicalIcon,
  GalleryVerticalEndIcon,
  HouseIcon,
  SettingsIcon,
  ToyBrickIcon
} from 'lucide-react';

type TabType = 'accueil' | 'sources' | 'extension' | 'settings' | 'poc';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accueil');

  return (
    <div className="app-container">
      <TopBar />

      <div className="main-layout">
        <aside className="sidebar">
          <h1>ScrapR</h1>
          <nav className="nav-links">
            <NavItem
              icon={<HouseIcon />}
              label="Accueil"
              active={activeTab === 'accueil'}
              onClick={() => setActiveTab('accueil')}
            />
            <NavItem
              icon={<GalleryVerticalEndIcon />}
              label="Sources"
              active={activeTab === 'sources'}
              onClick={() => setActiveTab('sources')}
            />
            <NavItem
              icon={<ToyBrickIcon />}
              label="Extension"
              active={activeTab === 'extension'}
              onClick={() => setActiveTab('extension')}
            />

            <NavItem
              icon={<FlaskConicalIcon />}
              label="POC"
              active={activeTab === 'poc'}
              onClick={() => setActiveTab('poc')}
            />
            <NavItem
              icon={<SettingsIcon />}
              label="Settings"
              isBottom={true}
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </nav>
        </aside>

        {/* Rendu conditionnel des pages */}
        {activeTab === 'accueil' && <PageAccueil />}
        {activeTab === 'sources' && <PageSources />}
        {activeTab === 'poc' && <PocApp />}
      </div>
    </div>
  );
};

export default App;
