import { ipcMain } from 'electron';
import { type IpcChannel, IpcContracts, type IpcHandler } from '@shared/ipcContractTypes';

export function handle<Channel extends IpcChannel>(
  channel: Channel,
  handler: IpcHandler<Channel>
): void {
  const contract = IpcContracts[channel];
  ipcMain.handle(channel, async (_event, ...args: unknown[]) => {
    // Indexing a heterogeneous contract map loses the channel/argument correlation.
    const input = contract.input.parse(args) as Parameters<IpcHandler<Channel>>;
    return contract.parseResult(input, await handler(...input));
  });
}
