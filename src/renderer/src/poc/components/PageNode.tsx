import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Code,
  Container,
  DataList,
  Flex,
  Grid,
  Separator,
  Text
} from '@radix-ui/themes';
import { ContextOf, Kind, Page, PagePreview } from '@shared/pluginTypes';
import { Descriptors } from '@shared/pluginGlobals';

export default function PageNode({
  context,
  prefill = []
}: {
  context: ContextOf<Kind[]>;
  prefill?: PagePreview[];
}): React.JSX.Element {
  const kind: Kind = Descriptors.PAGE;
  const inputGetRef = useRef<HTMLInputElement>(null);
  const inputSearchRef = useRef<HTMLInputElement>(null);
  const [getRes, setGetRes] = useState<Page | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [previewList, setPreviewList] = useState<PagePreview[]>(prefill);

  const ipcPageDoHandle = async (action: string, ...args) => {
    const ipcRes = await window.electron.ipcRenderer.invoke(
      'action:do',
      context,
      kind,
      action,
      ...args
    );
    if (action === 'get') setGetRes(ipcRes);
    if (action === 'search') setPreviewList(ipcRes);
  };

  useEffect(() => {
    setGetRes(null);
  }, [context]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('availableActions:get', context, kind)
      .then((actiosn) => setAvailableActions(actiosn));
  }, []);

  return (
    <Container>
      {previewList ? (
        <Container>
          <Grid columns="4" gap="3" rows="repeat(2, 64px)" width="auto">
            {previewList.map((preview) => (
              <Card>
                <Box>
                  <Text as="div" size="2" weight="bold">
                    {preview.id}
                  </Text>
                  {availableActions?.includes('get') ? (
                    <Button onClick={() => ipcPageDoHandle('get', preview.id)}>Get</Button>
                  ) : null}
                </Box>
              </Card>
            ))}
          </Grid>
        </Container>
      ) : null}
      {availableActions?.includes('search') ? (
        <Container>
          <input type={'text'} ref={inputSearchRef} />
          <Button onClick={() => ipcPageDoHandle('search', inputSearchRef.current!.value)}>
            Search
          </Button>
        </Container>
      ) : null}
      {availableActions?.includes('get') ? (
        <Container>
          <input type={'text'} ref={inputGetRef} />
          <Button onClick={() => ipcPageDoHandle('get', inputGetRef.current!.value)}>
            Get by id
          </Button>
        </Container>
      ) : null}
      <Separator />
      {getRes ? (
        <>
          <DataList.Root>
            <DataList.Item>
              <DataList.Label minWidth="88px">ID</DataList.Label>
              <DataList.Value>
                <Flex align="center" gap="2">
                  <Code variant="ghost">{getRes.id}</Code>
                </Flex>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Image</DataList.Label>
              <DataList.Value>
                <img src={getRes.dataUri} />
              </DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </>
      ) : null}
    </Container>
  );
}
