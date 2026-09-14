import * as Breadcrumbs from '@renderer/components/shared/Breadcrumbs/Breadcrumbs';
import { Fragment, JSX } from 'react';
import { resourceTitle } from '@renderer/utils/resourcePresentation';
import { DescriptorBrowserEntity } from '@renderer/hooks/useDescriptorBrowser';

export function BreadCrumb(props: { browser: DescriptorBrowserEntity }): JSX.Element {
  console.log(props.browser);
  return (
    <Breadcrumbs.Root>
      <Breadcrumbs.List>
        <Breadcrumbs.Item>
          <Breadcrumbs.Link asChild>
            <Breadcrumbs.Button
              onClick={() => void props.browser.back(0)}
              isCurrent={props.browser.current == undefined}
            >
              {props.browser.descriptorProps.source.name}
            </Breadcrumbs.Button>
          </Breadcrumbs.Link>
        </Breadcrumbs.Item>
        {props.browser.path.map((entity, index) => (
          <Fragment key={`${entity.kind}:${entity.id}`}>
            <Breadcrumbs.Separator />
            <Breadcrumbs.Item>
              <Breadcrumbs.Link asChild>
                <Breadcrumbs.Button
                  onClick={() => void props.browser.back(index + 1)}
                  isCurrent={props.browser.path.length == index + 1}
                >
                  {resourceTitle(entity)}
                </Breadcrumbs.Button>
              </Breadcrumbs.Link>
            </Breadcrumbs.Item>
          </Fragment>
        ))}
      </Breadcrumbs.List>
    </Breadcrumbs.Root>
  );
}
