export default (plugin) => {
  // plugin.routes["content-api"].routes.unshift({
  //   method: "POST",
  //   path: "/auth/local/register",
  //   handler: "api::mfa.mfa.register",
  //   config: {
  //     auth: false,
  //     middlewares: ["plugin::users-permissions.rateLimit"],
  //     prefix: "",
  //   },
  // });

  // plugin.routes["content-api"].routes.unshift({
  //   method: "POST",
  //   path: "/auth/local",
  //   handler: "api::mfa.mfa.login",
  //   config: {
  //     auth: false,
  //     middlewares: ["plugin::users-permissions.rateLimit"],
  //     prefix: "",
  //   },
  // });

  return plugin;
};
