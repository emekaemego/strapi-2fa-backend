/**
 * otp service
 */

import { factories } from "@strapi/strapi";
import { isAfter } from "date-fns";
import { Totp } from "time2fa";

export default factories.createCoreService("api::otp.otp", ({ strapi }) => ({
  async verifyOtp(email: string, code: string) {
    const otpEntry = await strapi.db.query("api::otp.otp").findOne({
      where: {
        code,
        user: { email: { $eq: email } },
      },
    });

    if (!otpEntry) return false;

    const now = new Date().toISOString();

    if (!isAfter(otpEntry.expiresAt, now)) return false;

    await strapi
      .documents("api::otp.otp")
      .delete({ documentId: otpEntry.documentId });

    return true;
  },

  async verifyTotp(code: string, secret: string) {
    const isValid = Totp.validate({ passcode: code, secret });

    if (!isValid) return false;

    return true;
  },
}));
