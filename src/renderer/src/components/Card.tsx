import React from 'react'
import CardProps from '@renderer/interfaces/CardProps'
import { IconImage } from '@renderer/components/icons'

const Card: React.FC<CardProps> = ({ title }) => (
  <div className="card">
    <div className="card-image-placeholder">
      <IconImage />
    </div>
    <span className="card-title">{title}</span>
  </div>
)

export default Card
