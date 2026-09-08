import React from 'react'
import ListItemProps from '@renderer/interfaces/ListItemProps'
import { IconImage, IconSettings, IconTrash } from '@renderer/components/icons'

const ListItem: React.FC<ListItemProps> = ({ title, lang }) => (
  <div className="list-item">
    <div className="list-item-image">
      <IconImage />
    </div>
    <div className="list-item-content">
      <span className="list-item-title">{title}</span>
      <span className="list-item-subtitle">• {lang}</span>
    </div>
    <div className="list-item-actions">
      <div className="action-icon">
        <IconTrash />
      </div>
      <div className="action-icon">
        <IconSettings />
      </div>
    </div>
  </div>
)

export default ListItem
