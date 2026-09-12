import { Box, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { UrlParser } from '@renderer/components/UrlParser/UrlParser';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import styles from './TopBar.module.css';

export default function TopBar(): ReactElement {
  const { history } = useRouter();
  const canGoBack = useCanGoBack();
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    let lastIndex = history.location.state.__TSR_index;

    return history.subscribe(({ location, action }) => {
      const index = location.state.__TSR_index;
      // A push after going back discards the forward branch. REPLACE preserves it.
      lastIndex = action.type === 'PUSH' ? index : Math.max(lastIndex, index);
      setCanGoForward(index < lastIndex);
    });
  }, [history]);

  return (
    <Flex
      align="center"
      gap="5"
      width="100%"
      className={styles.titleBar}
      data-platform={window.electron?.process.platform}
    >
      <Flex
        role="navigation"
        align="center"
        gap="3"
        flexShrink="0"
        aria-label="Navigation principale"
        className={styles.navigation}
      >
        <Tooltip content="Accueil">
          <IconButton asChild variant="ghost" color="gray">
            <Link to="/" aria-label="Accueil">
              <HomeIcon size={20} aria-hidden="true" />
            </Link>
          </IconButton>
        </Tooltip>
        <IconButton
          variant="ghost"
          color="gray"
          disabled={!canGoBack}
          onClick={() => history.back()}
          aria-label="Précédent"
          title="Précédent"
        >
          <ArrowLeftIcon size={20} aria-hidden="true" />
        </IconButton>
        <IconButton
          variant="ghost"
          color="gray"
          disabled={!canGoForward}
          onClick={() => history.forward()}
          aria-label="Suivant"
          title="Suivant"
        >
          <ArrowRightIcon size={20} aria-hidden="true" />
        </IconButton>
      </Flex>
      <Box flexGrow="1" minWidth="0" className={styles.urlParser}>
        <UrlParser />
      </Box>
    </Flex>
  );
}
