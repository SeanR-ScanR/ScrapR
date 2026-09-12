import { Box, Flex, IconButton, TextField } from '@radix-ui/themes';
import { ArrowLeftIcon, ArrowRightIcon, GlobeIcon, RotateCwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

export default function TopBar(): ReactElement {
  return (
    <Flex align="center" gap="3" width="100%">
      <Flex role="group" align="center" gap="1" aria-label="Commandes du navigateur indisponibles">
        <IconButton variant="ghost" color="gray" disabled aria-label="Précédent">
          <ArrowLeftIcon size={16} />
        </IconButton>
        <IconButton variant="ghost" color="gray" disabled aria-label="Suivant">
          <ArrowRightIcon size={16} />
        </IconButton>
        <IconButton variant="ghost" color="gray" disabled aria-label="Actualiser">
          <RotateCwIcon size={16} />
        </IconButton>
      </Flex>
      <Box flexGrow="1" minWidth="0">
        <TextField.Root size="2" readOnly aria-label="Adresse du navigateur" tabIndex={-1}>
          <TextField.Slot>
            <GlobeIcon size={16} aria-hidden="true" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
    </Flex>
  );
}
