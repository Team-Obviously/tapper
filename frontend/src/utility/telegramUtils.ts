
import { postRequest } from './generalServices'

/**
 * Open Telegram with a prefilled message.
 * 
 * @param message The message text to prefill
 * @param url Optional URL to include in the message
 */
export function sendTelegramMessage(message: string, url?: string) {
  const base = "https://t.me/share/url";
  const params = new URLSearchParams();

  if (url) params.append("url", url);
  if (message) params.append("text", message);

  const finalUrl = `${base}?${params.toString()}`;
  window.open(finalUrl, "_blank"); // Opens in new tab / Telegram app if installed
}

/**
 * Generate a personalized message using the backend API
 */
export async function generatePersonalizedMessage(fromUserId: string, toUserId: string) {
  try {
    const response = await postRequest('/api/telegram/generate-message', {
      fromUserId,
      toUserId
    });

    if (!response.data) {
      throw new Error('Failed to generate message');
    }

    return response.data;
  } catch (error) {
    console.error('Error generating personalized message:', error);
    throw error;
  }
}

/**
 * Send a message via Telegram using the backend API
 */
export async function sendMessageViaTelegram(fromUserId: string, toUserId: string, message: string) {
  try {
    const response = await fetch('/api/telegram/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message via Telegram:', error);
    throw error;
  }
}

/**
 * Get user's Telegram ID
 */
export async function getUserTelegramId(userId: string) {
  try {
    const response = await fetch(`/api/telegram/user/${userId}/telegram-id`);

    if (!response.ok) {
      throw new Error('Failed to get user Telegram ID');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user Telegram ID:', error);
    throw error;
  }
}
