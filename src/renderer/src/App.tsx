import React, { useState } from 'react'
import './assets/main.css'
import PageAccueil from '@renderer/pages/PageAccueil'
import PageSources from '@renderer/pages/PageSources'
import TopBar from '@renderer/components/TopBar'
import NavItem from '@renderer/components/NavItem'
import { IconHome, IconPlug, IconPuzzle, IconSettings } from '@renderer/components/icons'

type TabType = 'accueil' | 'sources' | 'extension' | 'settings'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accueil')

  return (
    <div className="app-container">
      <TopBar />

      <div className="main-layout">
        <aside className="sidebar">
          <h1>ScrapR</h1>
          <nav className="nav-links">
            <NavItem
              icon={<IconHome />}
              label="Accueil"
              active={activeTab === 'accueil'}
              onClick={() => setActiveTab('accueil')}
            />
            <NavItem
              icon={<IconPuzzle />}
              label="Sources"
              active={activeTab === 'sources'}
              onClick={() => setActiveTab('sources')}
            />
            <NavItem
              icon={<IconPlug />}
              label="Extension"
              active={activeTab === 'extension'}
              onClick={() => setActiveTab('extension')}
            />

            <NavItem
              icon={<IconSettings />}
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
      </div>
    </div>
  )
}

export default App
