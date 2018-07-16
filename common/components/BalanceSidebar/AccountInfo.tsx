import React from 'react';
import { connect } from 'react-redux';

import { etherChainExplorerInst } from 'config/data';
import translate, { translateRaw } from 'translations';
import { IWallet, HardwareWallet, Balance } from 'libs/wallet';
import { NetworkConfig } from 'types/network';
import { AppState } from 'features/reducers';
import { getNetworkConfig, getOffline, getChecksumAddressFn } from 'features/config';
import { walletActions } from 'features/wallet';
import Spinner from 'components/ui/Spinner';
import { UnitDisplay, NewTabLink } from 'components/ui';
import AccountAddress from './AccountAddress';
import './AccountInfo.scss';

interface OwnProps {
  wallet: IWallet;
}

interface StateProps {
  balance: Balance;
  network: ReturnType<typeof getNetworkConfig>;
  isOffline: ReturnType<typeof getOffline>;
  toChecksumAddress: ReturnType<typeof getChecksumAddressFn>;
}

interface State {
  showLongBalance: boolean;
  address: string;
  confirmAddr: boolean;
}

interface DispatchProps {
  refreshAccountBalance: walletActions.TRefreshAccountBalance;
}

type Props = OwnProps & StateProps & DispatchProps;

class AccountInfo extends React.Component<Props, State> {
  public state = {
    showLongBalance: false,
    address: '',
    confirmAddr: false
  };

  public setAddressFromWallet() {
    const address = this.props.wallet.getAddressString();
    if (address !== this.state.address) {
      this.setState({ address });
    }
  }

  public componentDidMount() {
    this.setAddressFromWallet();
  }

  public componentDidUpdate() {
    this.setAddressFromWallet();
  }

  public toggleConfirmAddr = () => {
    this.setState(state => {
      return { confirmAddr: !state.confirmAddr };
    });
  };

  public toggleShowLongBalance = (e: React.FormEvent<HTMLSpanElement>) => {
    e.preventDefault();
    this.setState(state => {
      return {
        showLongBalance: !state.showLongBalance
      };
    });
  };

  public render() {
    const { network, isOffline, balance, toChecksumAddress, wallet } = this.props;
    const { address, showLongBalance, confirmAddr } = this.state;

    let blockExplorer;
    let tokenExplorer;
    if (!network.isCustom) {
      // this is kind of ugly but its the result of typeguards, maybe we can find a cleaner solution later on such as just dedicating it to a selector
      blockExplorer = network.blockExplorer;
      tokenExplorer = network.tokenExplorer;
    }

    return (
      <div>
        <AccountAddress networkId={network.id} address={toChecksumAddress(address)} />

        {isHardwareWallet(wallet) && (
          <div className="AccountInfo-section actions">
            <a
              className="AccountInfo-address-hw-addr"
              onClick={() => {
                this.toggleConfirmAddr();
                wallet
                  .displayAddress()
                  .then(() => this.toggleConfirmAddr())
                  .catch((e: Error | string) => {
                    console.error('Display address failed', e);
                    this.toggleConfirmAddr();
                  });
              }}
            >
              {confirmAddr
                ? null
                : translate('SIDEBAR_DISPLAY_ADDR', { $wallet: wallet.getWalletType() })}
            </a>
            {confirmAddr ? (
              <span className="AccountInfo-address-confirm">
                <Spinner /> Confirm on {wallet.getWalletType()}
              </span>
            ) : null}
          </div>
        )}

        <div className="AccountInfo-section">
          <h5 className="AccountInfo-section-header">{translate('SIDEBAR_ACCOUNTBAL')}</h5>
          <ul className="AccountInfo-list">
            <li className="AccountInfo-list-item AccountInfo-balance">
              <span
                className="AccountInfo-list-item-clickable AccountInfo-balance-amount wrap"
                onClick={this.toggleShowLongBalance}
              >
                <UnitDisplay
                  value={balance.wei}
                  unit={'ether'}
                  displayShortBalance={!showLongBalance}
                  checkOffline={true}
                  symbol={balance.wei ? this.setSymbol(network) : null}
                />
              </span>
              {balance.wei && (
                <React.Fragment>
                  {balance.isPending ? (
                    <Spinner />
                  ) : (
                    !isOffline && (
                      <button
                        className="AccountInfo-section-refresh"
                        onClick={this.props.refreshAccountBalance}
                      >
                        <i className="fa fa-refresh" />
                      </button>
                    )
                  )}
                </React.Fragment>
              )}
            </li>
          </ul>
        </div>

        {(!!blockExplorer || !!tokenExplorer) &&
          network.id !== 'XMR' && (
            <div className="AccountInfo-section">
              <h5 className="AccountInfo-section-header">{translate('SIDEBAR_TRANSHISTORY')}</h5>
              <ul className="AccountInfo-list">
                {!!blockExplorer && (
                  <li className="AccountInfo-list-item">
                    <NewTabLink href={blockExplorer.addressUrl(address)}>
                      {`${blockExplorer.origin}`}
                    </NewTabLink>
                  </li>
                )}
                {network.id === 'ETH' && (
                  <li className="AccountInfo-list-item">
                    <NewTabLink href={etherChainExplorerInst.addressUrl(address)}>
                      {`${etherChainExplorerInst.origin}`}
                    </NewTabLink>
                  </li>
                )}
                {!!tokenExplorer && (
                  <li className="AccountInfo-list-item">
                    <NewTabLink href={tokenExplorer.address(address)}>
                      {`${tokenExplorer.name}`}
                    </NewTabLink>
                  </li>
                )}
              </ul>
            </div>
          )}
      </div>
    );
  }

  private setSymbol(network: NetworkConfig) {
    if (network.isTestnet) {
      return `${network.unit} (${translateRaw('TESTNET')})`;
    }
    return network.unit;
  }
}

function isHardwareWallet(wallet: IWallet): wallet is HardwareWallet {
  return typeof (wallet as any).displayAddress === 'function';
}

function mapStateToProps(state: AppState): StateProps {
  return {
    balance: state.wallet.balance,
    network: getNetworkConfig(state),
    isOffline: getOffline(state),
    toChecksumAddress: getChecksumAddressFn(state)
  };
}
const mapDispatchToProps: DispatchProps = {
  refreshAccountBalance: walletActions.refreshAccountBalance
};
export default connect(mapStateToProps, mapDispatchToProps)(AccountInfo);
