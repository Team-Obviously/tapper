import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { generatePersonalizedMessage, sendTelegramMessage } from '../utility/telegramUtils';
import { toast } from 'sonner';

interface TelegramMessageButtonProps {
  fromUserId: string;
  toUserId: string;
  toUserName?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function TelegramMessageButton({
  fromUserId,
  toUserId,
  toUserName = 'this user',
  className,
  variant = 'default',
  size = 'default',
}: TelegramMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!fromUserId) {
      toast.error('Please log in to send messages');
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate personalized message using the backend
      const response = await generatePersonalizedMessage(fromUserId, toUserId);
      
      if (response.success) {
        const { message, telegramUrl } = response.data;
        
        // Open Telegram with the generated message
        if (telegramUrl) {
          window.open(telegramUrl, '_blank');
          toast.success(`Opening Telegram to message ${toUserName}`);
        } else {
          // Fallback to the utility function
          sendTelegramMessage(message);
          toast.success(`Opening Telegram to message ${toUserName}`);
        }
      } else {
        throw new Error(response.error || 'Failed to generate message');
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendMessage}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      <span className="ml-2">
        {isLoading ? 'Generating...' : 'Send Message'}
      </span>
    </Button>
  );
}

export default TelegramMessageButton;
