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
import { ContextOf, Kind, Magazine, MagazinePreview } from '../../../../main/plugins/pluginTypes';
import DataTreeNode from '@renderer/poc/components/DataTreeNode';
import { withParent } from '@renderer/poc/utils/ContextUtils';
import { Descriptors } from '../../../../main/plugins/pluginGlobals';

function MagazineNode({
  context,
  prefill = []
}: {
  context: ContextOf<Kind[]>;
  prefill?: MagazinePreview[];
}): React.JSX.Element {
  const kind: Kind = Descriptors.MAGAZINE;
  const inputGetRef = useRef<HTMLInputElement>(null);
  const inputSearchRef = useRef<HTMLInputElement>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [getRes, setGetRes] = useState<Magazine | null>(null);
  const [previewList, setPreviewList] = useState<MagazinePreview[]>(prefill);

  const ipcDoHandle = async (action: string, ...args) => {
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
    window.electron.ipcRenderer
      .invoke('availableActions:get', context, kind)
      .then((actiosn) => setAvailableActions(actiosn));
  }, []);

  useEffect(() => {
    setGetRes(null);
  }, [context]);

  return (
    <Container>
      {previewList ? (
        <Container>
          <Grid columns="4" gap="3" rows="repeat(2, 64px)" width="auto">
            {previewList.map((preview) => (
              <Card>
                <Box>
                  <Text as="div" size="2" weight="bold">
                    {preview.title}
                  </Text>
                  {availableActions?.includes('get') ? (
                    <Button onClick={() => ipcDoHandle('get', preview.id)}>Get</Button>
                  ) : null}
                </Box>
              </Card>
            ))}
          </Grid>
        </Container>
      ) : null}
      <Separator />
      {availableActions?.includes('search') ? (
        <Container>
          <input type={'text'} ref={inputSearchRef} />
          <Button onClick={() => ipcDoHandle('search', inputSearchRef.current!.value)}>
            Search
          </Button>
        </Container>
      ) : null}
      {availableActions?.includes('get') ? (
        <Container>
          <input type={'text'} ref={inputGetRef} />
          <Button onClick={() => ipcDoHandle('get', inputGetRef.current!.value)}>Get by id</Button>
        </Container>
      ) : null}
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
              <DataList.Label minWidth="88px">Title</DataList.Label>
              <DataList.Value>{getRes.title}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Description</DataList.Label>
              <DataList.Value>{getRes.description}</DataList.Value>
            </DataList.Item>
          </DataList.Root>
          {getRes.has ? (
            <DataTreeNode
              context={withParent(context, getRes)}
              tabs={Object.keys(getRes.has) as any /*TODO: type*/}
              prefill={getRes.has}
            />
          ) : (
            <></>
          )}
        </>
      ) : null}
    </Container>
  );
}

export default MagazineNode;
