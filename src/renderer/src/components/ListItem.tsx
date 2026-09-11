import React from 'react';
import ListItemProps from '@renderer/interfaces/ListItemProps';
import { ImageOffIcon, SettingsIcon, TrashIcon } from 'lucide-react';

const ListItem: React.FC<ListItemProps> = ({ title, lang }) => (
  <div className="list-item">
    <div className="list-item-image">
      <ImageOffIcon />
    </div>
    <div className="list-item-content">
      <span className="list-item-title">{title}</span>
      <span className="list-item-subtitle">• {lang}</span>
    </div>
    <div className="list-item-actions">
      <div className="action-icon">
        <TrashIcon />
      </div>
      <div className="action-icon">
        <SettingsIcon />
      </div>
    </div>
  </div>
);

export default ListItem;
