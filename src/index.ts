// import type { Core } from '@strapi/strapi';

import { Core } from "@strapi/strapi";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const contentTypeName = strapi.contentType(
      "plugin::users-permissions.user"
    );

    contentTypeName.attributes = {
      // Spread previous defined attributes
      ...contentTypeName.attributes,
      // Add new, or override attributes
      totpSecret: {
        type: "string",
        private: true,
        configurable: false,
      },
      enableTotp: {
        type: "boolean",
        default: false,
        configurable: false,
      },
    };

    // contentTypeName.attributes.totpSecret.pluginOptions = {
    //   editableInAdmin: false,
    // };
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
