import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import CardProps from '@renderer/interfaces/CardProps';
import { ImageOffIcon } from 'lucide-react';

const Card: React.FC<CardProps> = ({ title }) => (
  <Flex direction="column" align="center" className="card">
    <Flex align="center" justify="center" className="card-image-placeholder">
      <ImageOffIcon aria-hidden="true" />
    </Flex>
    <Text size="2" weight="medium" align="center" className="card-title">
      {title}
    </Text>
  </Flex>
);

export default Card;
