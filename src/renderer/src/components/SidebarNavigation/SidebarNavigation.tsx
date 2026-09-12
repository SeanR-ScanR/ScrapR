import { Box, Button, Flex, Heading, Separator } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import {
  FlaskConicalIcon,
  GalleryVerticalEndIcon,
  HouseIcon,
  SettingsIcon,
  ToyBrickIcon
} from 'lucide-react';
import styles from './SidebarNavigation.module.css';

const pages = [
  { to: '/', label: 'Accueil', icon: HouseIcon },
  { to: '/sources', label: 'Sources', icon: GalleryVerticalEndIcon },
  { to: '/extension', label: 'Extension', icon: ToyBrickIcon },
  { to: '/poc', label: 'POC', icon: FlaskConicalIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
] as const;

export function SidebarNavigation(): ReactElement {
  const matchRoute = useMatchRoute();
  return (
    <>
      <Heading as="h1" size="6" align="center" my="6">
        ScrapR
      </Heading>
      <Flex asChild direction="column" flexGrow="1" gap="2" p="3">
        <nav aria-label="Navigation principale">
          {pages.map(({ to, label, icon: Icon }) => {
            const active = !!matchRoute({ to, fuzzy: to !== '/' });
            return (
              <Box key={to} mt={to === '/settings' ? 'auto' : undefined}>
                {to === '/settings' && <Separator size="4" my="3" />}
                <Button
                  asChild
                  size={{ initial: '2', sm: '3' }}
                  variant="soft"
                  color={active ? undefined : 'gray'}
                  highContrast={!active}
                  className={styles.item}
                >
                  <Link to={to} activeOptions={{ exact: to === '/' }}>
                    <Flex asChild flexShrink="0">
                      <Icon size={20} aria-hidden="true" />
                    </Flex>
                    {label}
                  </Link>
                </Button>
              </Box>
            );
          })}
        </nav>
      </Flex>
    </>
  );
}
