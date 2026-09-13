import { Button, TextField } from '@radix-ui/themes';
import type { ComponentProps, ReactElement } from 'react';

export type RootProps = Omit<ComponentProps<'form'>, 'onSubmit' | 'onSearch'> & {
  onSearch: (query: string) => void;
};
export type InputProps = ComponentProps<typeof TextField.Root>;
export type SubmitProps = ComponentProps<typeof Button>;
export type ClearProps = ComponentProps<typeof Button>;
export type SlotProps = ComponentProps<typeof TextField.Slot>;

export function Root({ onSearch, ...props }: RootProps): ReactElement {
  return (
    <form
      role="search"
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('query');
        onSearch(typeof query === 'string' ? query : '');
      }}
    />
  );
}

export function Input(props: InputProps): ReactElement {
  return <TextField.Root name="query" type="search" aria-label="Rechercher" {...props} />;
}

export function Submit(props: SubmitProps): ReactElement {
  return <Button type="submit" {...props} />;
}

export function Clear(props: ClearProps): ReactElement {
  return <Button type="button" {...props} />;
}

export const Slot = TextField.Slot;
