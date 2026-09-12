import { Box, Button, Flex, Heading, Separator } from '@radix-ui/themes';
import type { ReactElement } from 'react';
import {
  FlaskConicalIcon,
  GalleryVerticalEndIcon,
  HouseIcon,
  SettingsIcon,
  ToyBrickIcon
} from 'lucide-react';
import styles from './SidebarNavigation.module.css';

const pages = [
  { id: 'accueil', label: 'Accueil', icon: HouseIcon },
  { id: 'sources', label: 'Sources', icon: GalleryVerticalEndIcon },
  { id: 'extension', label: 'Extension', icon: ToyBrickIcon },
  { id: 'poc', label: 'POC', icon: FlaskConicalIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
] as const;

export type PageId = (typeof pages)[number]['id'];

type SidebarNavigationProps = {
  value: PageId;
  onValueChange: (value: PageId) => void;
};

export function SidebarNavigation({ value, onValueChange }: SidebarNavigationProps): ReactElement {
  return (
    <>
      <Heading as="h1" size="6" align="center" my="6">
        ScrapR
      </Heading>
      <Flex asChild direction="column" flexGrow="1" gap="2" p="3">
        <nav aria-label="Navigation principale">
          {pages.map(({ id, label, icon: Icon }) => (
            <Box key={id} mt={id === 'settings' ? 'auto' : undefined}>
              {id === 'settings' && <Separator size="4" my="3" />}
              <Button
                type="button"
                size={{ initial: '2', sm: '3' }}
                variant="soft"
                color={value === id ? undefined : 'gray'}
                highContrast={value !== id}
                aria-current={value === id ? 'page' : undefined}
                onClick={() => onValueChange(id)}
                className={styles.item}
              >
                <Flex asChild flexShrink="0">
                  <Icon size={20} aria-hidden="true" />
                </Flex>
                {label}
              </Button>
            </Box>
          ))}
        </nav>
      </Flex>
    </>
  );
}
