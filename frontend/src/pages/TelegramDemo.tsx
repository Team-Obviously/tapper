import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import TelegramMessageButton from '../components/TelegramMessageButton';
import { generatePersonalizedMessage, sendTelegramMessage } from '../utility/telegramUtils';
import { toast } from 'sonner';

export default function TelegramDemo() {
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMessage = async () => {
    if (!fromUserId || !toUserId) {
      toast.error('Please enter both user IDs');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generatePersonalizedMessage(fromUserId, toUserId);
      if (response.success) {
        setGeneratedMessage(response.data.message);
        toast.success('Message generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to generate message');
      }
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error('Failed to generate message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendCustomMessage = () => {
    if (!customMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    sendTelegramMessage(customMessage);
    toast.success('Opening Telegram with your message!');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Telegram Integration Demo</h1>
          <p className="text-muted-foreground">
            Test the personalized message generation and Telegram integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Personalized Message */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Personalized Message</CardTitle>
              <CardDescription>
                Use AI to generate a personalized message based on user similarity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fromUserId">From User ID</Label>
                <Input
                  id="fromUserId"
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  placeholder="Enter sender's user ID"
                />
              </div>
              <div>
                <Label htmlFor="toUserId">To User ID</Label>
                <Input
                  id="toUserId"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  placeholder="Enter recipient's user ID"
                />
              </div>
              <Button 
                onClick={handleGenerateMessage} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Message'}
              </Button>
              
              {generatedMessage && (
                <div className="mt-4">
                  <Label>Generated Message:</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {generatedMessage}
                  </div>
                  <div className="mt-2">
                    <TelegramMessageButton
                      fromUserId={fromUserId}
                      toUserId={toUserId}
                      toUserName="the recipient"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle>Send Custom Message</CardTitle>
              <CardDescription>
                Send a custom message directly via Telegram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customMessage">Your Message</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleSendCustomMessage}
                className="w-full"
              >
                Send via Telegram
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Integration Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
            <CardDescription>
              How to integrate Telegram messaging into your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Import the Component</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import TelegramMessageButton from '../components/TelegramMessageButton';`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Use the Component</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`<TelegramMessageButton
  fromUserId={currentUserId}
  toUserId={targetUserId}
  toUserName="John Doe"
  variant="outline"
  size="sm"
/>`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Backend API Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>POST /api/telegram/generate-message</strong> - Generate personalized message</p>
                  <p><strong>POST /api/telegram/send-message</strong> - Send message via Telegram</p>
                  <p><strong>GET /api/telegram/user/:userId/telegram-id</strong> - Get user's Telegram ID</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Message Types</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• <strong>Sports:</strong> Messages about shared sports interests and meetup suggestions</p>
                  <p>• <strong>Career:</strong> Professional collaboration messages with resume context</p>
                  <p>• <strong>Relationship:</strong> Friendly, warm messages for personal connections</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
