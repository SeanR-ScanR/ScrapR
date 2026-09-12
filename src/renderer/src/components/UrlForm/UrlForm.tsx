import { Button, TextField } from '@radix-ui/themes';
import type { ComponentProps, ReactElement } from 'react';

type RootProps = Omit<ComponentProps<'form'>, 'onSubmit'> & {
  onParse: (url: string) => void;
};

export function Root({ onParse, ...props }: RootProps): ReactElement {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('url');
        if (typeof value === 'string') onParse(value.trim());
      }}
    />
  );
}

export function Input(props: ComponentProps<typeof TextField.Root>): ReactElement {
  return <TextField.Root name="url" type="url" required aria-label="URL" {...props} />;
}

export function Submit(props: ComponentProps<typeof Button>): ReactElement {
  return <Button type="submit" {...props} />;
}

export const Slot = TextField.Slot;
