import React, { useState } from 'react';
import { Flex, Heading } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './assets/main.css';
import AppTheme from '@renderer/components/AppTheme';
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

      <Flex className="main-layout">
        <AppTheme>
          <Flex asChild direction="column" className="sidebar">
            <aside>
              <Heading as="h1" size="5" className="brand-title">
                ScrapR
              </Heading>
              <Flex asChild direction="column" flexGrow="1">
                <nav aria-label="Navigation principale">
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
              </Flex>
            </aside>
          </Flex>
        </AppTheme>

        {/* Rendu conditionnel des pages */}
        {activeTab === 'accueil' && <PageAccueil />}
        {activeTab === 'sources' && <PageSources />}
        {activeTab === 'poc' && <PocApp />}
      </Flex>
    </div>
  );
};

export default App;
