import React from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import AppTheme from './AppTheme';

const TopBar: React.FC = () => (
  <AppTheme>
    <Flex align="center" className="topbar" aria-hidden="true">
      <Flex className="window-controls">
        <Box className="dot" />
        <Box className="dot" />
        <Box className="dot" />
      </Flex>
      <Flex className="browser-nav">
        <Text>{'<'}</Text>
        <Text>{'>'}</Text>
        <Text>{'↻'}</Text>
      </Flex>
      <Box flexGrow="1" className="address-bar" />
    </Flex>
  </AppTheme>
);

export default TopBar;
