import { render } from "react-email";

import type { EmailSender } from "./sender";
import OTPEmail from "./templates/otp";

export interface OTPEmailOptions {
  email: string;
  otp: string;
  productName?: string;
}

export class OTPService {
  constructor(private emailSender: EmailSender) {}

  async sendOTP(options: OTPEmailOptions): Promise<void> {
    const html = await render(
      OTPEmail({
        email: options.email,
        otp: options.otp,
        productName: options.productName ?? "Example App",
      }),
    );

    const text = this.generatePlainText(options);

    const subject = `Your ${options.productName ?? "Example App"} sign-in code`;

    await this.emailSender.sendEmail({
      to: options.email,
      subject,
      html,
      text,
    });
  }

  private generatePlainText(options: OTPEmailOptions): string {
    const { productName = "Example App", email, otp } = options;

    return `
Use this code to sign in to your ${productName} account:

Email: ${email}
Verification Code: ${otp}

This code will expire in 5 minutes for your security.

If you did not request this code, please ignore this email or contact support if you have concerns.
    `.trim();
  }
}
