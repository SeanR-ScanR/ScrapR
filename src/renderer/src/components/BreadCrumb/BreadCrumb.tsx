import * as Breadcrumbs from '@renderer/components/shared/Breadcrumbs/Breadcrumbs';
import { FolderRootIcon } from 'lucide-react';
import { Fragment, JSX } from 'react';
import { resourceTitle } from '@renderer/utils/resourcePresentation';
import { DescriptorBrowser } from '@renderer/hooks/useDescriptorBrowser';

export function BreadCrumb(props: { browser: DescriptorBrowser }): JSX.Element {
  return (
    <Breadcrumbs.Root>
      <Breadcrumbs.List>
        {(props.browser.current || props.browser.openingEntry || props.browser.resourcePending) && (
          <Breadcrumbs.Item>
            <Breadcrumbs.Link asChild>
              <button
                type="button"
                aria-label="Retour aux resultats"
                onClick={() => void props.browser.back(0)}
              >
                <FolderRootIcon />
              </button>
            </Breadcrumbs.Link>
          </Breadcrumbs.Item>
        )}
        {(props.browser.openingEntry ? props.browser.path : props.browser.path.slice(0, -1)).map(
          (entity, index) => (
            <Fragment key={`${entity.kind}:${entity.id}`}>
              <Breadcrumbs.Separator />
              <Breadcrumbs.Item>
                <Breadcrumbs.Link asChild>
                  <button type="button" onClick={() => void props.browser.back(index + 1)}>
                    {resourceTitle(entity)}
                  </button>
                </Breadcrumbs.Link>
              </Breadcrumbs.Item>
            </Fragment>
          )
        )}
      </Breadcrumbs.List>
    </Breadcrumbs.Root>
  );
}
