import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SMSService {
  async sendOtp(mobileNumber: string, otp: number): Promise<boolean> {
    try {
      const sendOTP = await axios.post(
        `https://restapi.smscountry.com/v0.1/Accounts/${process.env.SMS_AUTH_KEY}/SMSes/`,
        {
          Text: `Your OTP for Yoga Bharath verification is ${otp}. Do not share this OTP with anyone.`,
          Number: `91${mobileNumber}`,
          SenderId: process.env.SENDER_ID,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.SMS_AUTH_KEY}:${process.env.PASSWORD}`,
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return !!sendOTP;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  }

  // async sendBulkSms(
  //   mobileNumbers: string[],
  //   message: string,
  // ): Promise<boolean> {
  //   try {
  //     console.log('numbers.....', mobileNumbers);
  //     const numbers = mobileNumbers.map((number) => {
  //       return '91' + number;
  //     });

  //     const smsPayload = {
  //       Numbers: numbers.join(','),
  //       Text: message,
  //       SenderId: process.env.SENDER_ID,
  //     };

  //     console.log(
  //       'SMS Payload:',
  //       JSON.stringify({ SMSes: smsPayload }, null, 2),
  //     );

  //     const response = await axios.post(
  //       `https://restapi.smscountry.com/v0.1/Accounts/${process.env.SMS_AUTH_KEY}/BulkSMSes/`,
  //       {
  //         SMSes: [
  //           // ✅ Array, not an object
  //           {
  //             Number: numbers.join(','), // or try "Numbers"
  //             Text: message,
  //             SenderId: process.env.SENDER_ID,
  //           },
  //         ],
  //       },
  //       {
  //         headers: {
  //           Authorization: `Basic ${Buffer.from(
  //             `${process.env.SMS_AUTH_KEY}:${process.env.PASSWORD}`,
  //           ).toString('base64')}`,
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     console.log('SMS Response:', response.data);
  //     return !!response;
  //   } catch (error) {
  //     console.error('Bulk SMS error:', error?.response?.data || error.message);
  //     return false;
  //   }
  // }

  async sendBulkSms(
    mobileNumbers: string[],
    message: string,
  ): Promise<boolean> {
    try {
      console.log('numbers.....', mobileNumbers);

      const authHeader = `Basic ${Buffer.from(
        `${process.env.SMS_AUTH_KEY}:${process.env.PASSWORD}`,
      ).toString('base64')}`;

      const results = await Promise.allSettled(
        mobileNumbers.map(async (number) => {
          const response = await axios.post(
            `https://restapi.smscountry.com/v0.1/Accounts/${process.env.SMS_AUTH_KEY}/SMSes/`,
            {
              Text: message,
              Number: `91${number}`,
              SenderId: process.env.SENDER_ID,
            },
            {
              headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
              },
            },
          );
          return response.data;
        }),
      );

      // Log success/failure per number
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ SMS sent to ${mobileNumbers[index]}:`, result.value);
        } else {
          console.error(
            `❌ SMS failed for ${mobileNumbers[index]}:`,
            result.reason,
          );
        }
      });

      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      console.log(
        `SMS Summary: ${successCount}/${mobileNumbers.length} sent successfully`,
      );

      return successCount > 0;
    } catch (error) {
      console.error('Bulk SMS error:', error?.response?.data || error.message);
      return false;
    }
  }
}
