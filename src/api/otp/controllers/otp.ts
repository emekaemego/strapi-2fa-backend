/**
 * otp controller
 */

import { factories } from "@strapi/strapi";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";
import utils from "@strapi/utils";
import { Totp } from "time2fa";
const { ValidationError, ApplicationError } = utils.errors;

// function generateOtp() {
//   return randomInt(1000_000).toString().padStart(6, "0");
// }

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

export default factories.createCoreController("api::otp.otp", ({ strapi }) => ({
  async register(ctx, next) {
    await strapi.controllers["plugin::users-permissions.auth"].register(
      ctx,
      next
    );

    ctx.send({ success: true });
  },

  async login(ctx, next) {
    const provider = ctx.params.provider || "local";

    await strapi.controllers["plugin::users-permissions.auth"].callback(
      ctx,
      next
    );

    if (provider === "local" || provider === "email") {
      // } else {
      //   await strapi.controllers["plugin::users-permissions.auth"].callback(
      //     ctx,
      //     next
      //   );

      try {
        const body: any = ctx.body;

        const user = await strapi
          .documents("plugin::users-permissions.user")
          .findOne({ documentId: body.user.documentId });

        let verifyType: "otp" | "totp" = "totp";

        if (!user.enableTotp || !user.totpSecret) {
          verifyType = "otp";
          const now = new Date(new Date().toISOString());
          const expiresAt = addMinutes(now, 30);
          const code = randomInt(1000_000).toString().padStart(6, "0");

          const otpEntry = await strapi.documents("api::otp.otp").create({
            data: {
              code,
              expiresAt,
              user: user.id,
            },
          });

          await strapi
            .plugin("email")
            .service("email")
            .send({
              to: user.email,
              from: "noreply@example.com",
              subject: "Login OTP",
              text: `Your login OTP is: ${otpEntry.code}`,
            });
        }

        ctx.send({ email: user.email, verifyType });
      } catch (err) {
        ctx.body = err;
      }
    }
  },

  async verifyCode(ctx) {
    const { code, email, type } = ctx.request.body;

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { email } });

    if (!user) throw new ValidationError("Code verification failed");

    let isValid = false;

    if (type === "totp") {
      isValid = await strapi
        .service("api::otp.otp")
        .verifyTotp(code, user.totpSecret);
    } else {
      isValid = await strapi.service("api::otp.otp").verifyOtp(email, code);
    }

    if (!isValid) throw new ValidationError("Code verification failed");

    const userDto: any = await sanitizeUser(user, ctx);

    ctx.send({
      jwt: strapi.plugins["users-permissions"].services.jwt.issue({
        id: userDto.id,
      }),
      user: await sanitizeUser(userDto, ctx),
    });
  },

  async generateTotpSecret(ctx) {
    if (!ctx.state.user) {
      throw new ApplicationError(
        "You must be authenticated to setup Authentication App"
      );
    }

    const data = Totp.generateKey({
      issuer: "StrapiOtp",
      user: ctx.state.user.email,
    });

    ctx.send({ email: data.user, secret: data.secret, url: data.url });
  },

  async saveTotpSecret(ctx) {
    if (!ctx.state.user) {
      throw new ApplicationError(
        "You must be authenticated to setup Authentication App"
      );
    }

    const { secret, code } = ctx.request.body;
    const success = Totp.validate({ passcode: code, secret });

    if (!success) {
      throw new ValidationError("Secret and code validation failed");
    }

    await strapi.plugins["users-permissions"].services.user.edit(
      ctx.state.user.id,
      {
        totpSecret: secret,
        enableTotp: true,
      }
    );

    ctx.send({ success });
  },

  async totpEnabled(ctx) {
    const user = await strapi
      .documents("plugin::users-permissions.user")
      .findOne({ documentId: ctx.state.user.documentId });

    const enabled = user.enableTotp && user.totpSecret;

    ctx.send({ enabled });
  },
}));
