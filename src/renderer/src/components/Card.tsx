import React from 'react';
import CardProps from '@renderer/interfaces/CardProps';
import { ImageOffIcon } from 'lucide-react';

const Card: React.FC<CardProps> = ({ title }) => (
  <div className="card">
    <div className="card-image-placeholder">
      <ImageOffIcon />
    </div>
    <span className="card-title">{title}</span>
  </div>
);

export default Card;
