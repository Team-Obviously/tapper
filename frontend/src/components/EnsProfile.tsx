import React from 'react'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { Button } from './ui/button'
import { Wallet, User } from 'lucide-react'

interface EnsProfileProps {
  onConnect?: () => void
  className?: string
}

export const EnsProfile: React.FC<EnsProfileProps> = ({ onConnect, className = '' }) => {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address, chainId: 1 })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName, chainId: 1 })

  if (!isConnected || !address) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Button
          onClick={onConnect}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet for ENS
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-muted/50 rounded-lg ${className}`}>
      <div className="flex-shrink-0">
        {ensAvatar ? (
          <img
            src={ensAvatar}
            alt={ensName || 'ENS Avatar'}
            className="w-10 h-10 rounded-full border-2 border-primary/20"
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">
            {ensName || 'No ENS Name'}
          </span>
          {ensName && (
            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
              ENS
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono truncate">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
        </span>
      </div>
    </div>
  )
}

export default EnsProfile
