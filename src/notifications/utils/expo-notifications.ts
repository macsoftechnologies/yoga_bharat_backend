import axios from 'axios';

/**
 * Sends push notifications to one or more Expo Push Tokens via the Expo Push API.
 * 
 * @param tokens - Single Expo Push Token or an array of Expo Push Tokens
 * @param title - The title of the push notification
 * @param body - The body message of the push notification
 * @param data - Optional extra data payload to send with the notification
 * @returns An object indicating success and containing either response data or the error message
 */
export async function sendExpoPushNotification(
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Filter for valid Expo Push Tokens
    const validTokens = tokenArray.filter(
      (token) =>
        token &&
        typeof token === 'string' &&
        (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')),
    );

    if (validTokens.length === 0) {
      console.log('No valid Expo push tokens found.');
      return { success: false, error: 'No valid Expo push tokens found' };
    }

    // Prepare message payloads
    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    // Post to Expo Push Notification API
    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log('Expo Push Response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    const errMsg = error?.response?.data || error.message;
    console.error('Error sending Expo push notification:', errMsg);
    return {
      success: false,
      error: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg,
    };
  }
}
