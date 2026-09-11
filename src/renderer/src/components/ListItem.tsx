import React from 'react';
import { Flex, IconButton, Text } from '@radix-ui/themes';
import ListItemProps from '@renderer/interfaces/ListItemProps';
import { ImageOffIcon, SettingsIcon, TrashIcon } from 'lucide-react';

const ListItem: React.FC<ListItemProps> = ({ title, lang }) => (
  <Flex asChild align="center" className="list-item">
    <li>
      <Flex align="center" justify="center" flexShrink="0" className="list-item-image">
        <ImageOffIcon aria-hidden="true" />
      </Flex>
      <Flex align="center" gap="2" flexGrow="1" wrap="wrap" className="list-item-content">
        <Text size="2" weight="medium" className="list-item-title">
          {title}
        </Text>
        <Text size="2" className="list-item-subtitle">
          • {lang}
        </Text>
      </Flex>
      <Flex flexShrink="0" className="list-item-actions">
        <IconButton
          type="button"
          variant="ghost"
          disabled
          aria-label={`Supprimer ${title}`}
          className="action-icon"
        >
          <TrashIcon aria-hidden="true" />
        </IconButton>
        <IconButton
          type="button"
          variant="ghost"
          disabled
          aria-label={`Paramètres de ${title}`}
          className="action-icon"
        >
          <SettingsIcon aria-hidden="true" />
        </IconButton>
      </Flex>
    </li>
  </Flex>
);

export default ListItem;
