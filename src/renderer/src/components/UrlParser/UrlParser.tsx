import { Button, Dialog, Flex, Popover, RadioGroup, Spinner, Text } from '@radix-ui/themes';
import { LinkIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import * as UrlForm from '@renderer/components/UrlForm/UrlForm';
import { descriptorQueries } from '@renderer/services/ipcQueries';
import { cacheParsedResource } from '@renderer/services/exploreNavigation';
import { descriptorLabels } from '@renderer/utils/resourcePresentation';
import type { UrlDiscoveryResult } from '@shared/pluginTypes';

type Match = UrlDiscoveryResult['matches'][number];

export function UrlParser(): ReactElement {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const request = useRef(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [input, setInput] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selection, setSelection] = useState('');

  useEffect(() => {
    const unsubscribe = router.subscribe('onBeforeNavigate', () => {
      request.current += 1;
      setOpen(false);
      setBusy(false);
    });
    return () => {
      unsubscribe();
      request.current += 1;
    };
  }, [router]);

  function dismiss(): void {
    request.current += 1;
    setOpen(false);
    setBusy(false);
  }

  async function parse(match: Match, value: string, id: number): Promise<void> {
    setBusy(true);
    try {
      const result = await queryClient.query(
        descriptorQueries.parseUrl(match.pluginId, match.sourceId, match.path, value)
      );
      if (request.current !== id) return;
      const resource = cacheParsedResource(match.pluginId, match.sourceId, result);
      await navigate({
        to: '/explore/$pluginId/$sourceId',
        params: { pluginId: match.pluginId, sourceId: match.sourceId },
        search: { kind: result.parents[0]?.kind ?? result.entity.kind, resource }
      });
      setInput((current) => (current.trim() === value ? '' : current));
      setOpen(false);
    } catch (error) {
      if (request.current === id)
        setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      if (request.current === id) setBusy(false);
    }
  }

  async function discover(value: string): Promise<void> {
    const id = ++request.current;
    setUrl(value);
    setMatches([]);
    setSelection('');
    setErrors([]);
    setOpen(false);
    setBusy(true);
    try {
      const parsed = new URL(value);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        throw new Error('Utilisez une URL HTTP ou HTTPS.');
      }
      const result = await queryClient.query(descriptorQueries.discoverUrl(parsed.href));
      if (request.current !== id) return;
      setMatches(result.matches);
      setErrors(result.errors);
      if (result.matches.length > 1) {
        setOpen(true);
      } else if (result.matches.length === 1) {
        await parse(result.matches[0], value, id);
      } else if (!result.matches.length && !result.errors.length) {
        setErrors(['Aucune ressource ne prend en charge cette URL.']);
      }
    } catch (error) {
      if (request.current === id)
        setErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      if (request.current === id) setBusy(false);
    }
  }

  return (
    <>
      <UrlForm.Root onParse={(value) => void discover(value)}>
        <Flex gap="2" align="center">
          <UrlForm.Input
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Ouvrir une URL..."
            aria-label="URL toutes sources"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          >
            <UrlForm.Slot>
              {busy ? (
                <span role="status" aria-label="Verification de l'URL">
                  <Spinner />
                </span>
              ) : (
                <LinkIcon size={16} aria-hidden="true" />
              )}
            </UrlForm.Slot>
          </UrlForm.Input>
          <UrlForm.Submit variant="soft" disabled={busy}>
            Ouvrir
          </UrlForm.Submit>
          {!open && errors.length > 0 && (
            <Popover.Root>
              <Popover.Trigger>
                <Button type="button" variant="soft" color="red" aria-label="Erreurs URL">
                  !
                </Button>
              </Popover.Trigger>
              <Popover.Content maxWidth="420px">
                {errors.map((error, index) => (
                  <Text as="p" key={index} role="alert" color="red">
                    {error}
                  </Text>
                ))}
              </Popover.Content>
            </Popover.Root>
          )}
        </Flex>
      </UrlForm.Root>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) dismiss();
        }}
      >
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>Ouvrir une URL</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Choisissez la source et le type de ressource. Seul votre choix sera analyse.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            {busy && <Text role="status">Chargement...</Text>}
            {errors.map((error, index) => (
              <Text key={index} role="alert" color="red">
                {error}
              </Text>
            ))}
            {matches.length > 0 && (
              <RadioGroup.Root
                aria-label="Ressource a ouvrir"
                value={selection}
                onValueChange={setSelection}
                disabled={busy}
              >
                {matches.map((match, index) => (
                  <RadioGroup.Item
                    key={`${match.pluginId}/${match.sourceId}/${match.path.join('/')}`}
                    value={String(index)}
                  >
                    {match.pluginName} / {match.sourceName} :{' '}
                    {match.path.map((kind) => descriptorLabels[kind]).join(' / ')}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            )}
            <Flex justify="end" gap="2" mt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button
                disabled={busy || selection === ''}
                onClick={() => {
                  const match = matches[Number(selection)];
                  if (match) {
                    setOpen(false);
                    void parse(match, url, ++request.current);
                  }
                }}
              >
                Ouvrir la ressource
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
