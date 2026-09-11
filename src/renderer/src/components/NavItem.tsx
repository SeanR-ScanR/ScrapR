import React from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';
import NavItemProps from '@renderer/interfaces/NavItemProps';

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isBottom = false }) => (
  <Button
    type="button"
    variant={active ? 'solid' : 'ghost'}
    size="3"
    radius="none"
    className={`nav-item ${active ? 'active' : ''} ${isBottom ? 'settings-link' : ''}`}
    aria-current={active ? 'page' : undefined}
    onClick={onClick}
  >
    <Flex asChild flexShrink="0" aria-hidden="true">
      <span>{icon}</span>
    </Flex>
    <Text>{label}</Text>
  </Button>
);

export default NavItem;
