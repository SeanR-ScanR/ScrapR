import React from 'react'
import NavItemProps from '@renderer/interfaces/NavItemProps'

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isBottom = false }) => (
  <div
    className={`nav-item ${active ? 'active' : ''} ${isBottom ? 'settings-link' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </div>
)

export default NavItem
