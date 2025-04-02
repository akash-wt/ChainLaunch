import './App.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';


function App() {

  return (

    <ConnectionProvider endpoint={"https://solana-devnet.g.alchemy.com/v2/6AmDWOqyYR46J3sGghnHIkg_04v5YzZb"}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>

          <div className='flex justify-between align-item '>
            <WalletMultiButton />
            <WalletDisconnectButton />
          </div>
          <TokenLaunchpad />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
