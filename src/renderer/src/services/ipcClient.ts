import {
  type IpcArguments,
  type IpcChannel,
  IpcContracts,
  type IpcResult
} from '@shared/ipcContractTypes';

export async function invoke<Channel extends IpcChannel>(
  channel: Channel,
  ...args: IpcArguments<Channel>
): Promise<IpcResult<Channel>> {
  const contract = IpcContracts[channel];
  const input = contract.input.parse(args);
  const result: unknown = await window.electron.ipcRenderer.invoke(channel, ...input);
  // The selected contract guarantees the result for this channel.
  return contract.parseResult(input, result) as IpcResult<Channel>;
}
