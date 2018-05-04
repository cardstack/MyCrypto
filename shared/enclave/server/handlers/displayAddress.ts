import { getWalletLib } from 'shared/enclave/server/wallets';
import { DisplayAddressParams, DisplayAddressResponse } from 'shared/enclave/types';

export default function(params: DisplayAddressParams): Promise<DisplayAddressResponse> {
  const wallet = getWalletLib(params.walletType);
  return wallet.displayAddress(params.path);
}
