const axios = require("axios");

module.exports = async () => {
  const foo = await axios("https://api.foo.com/v1");
  const user = foo.data;
  user.comments = [];
  try {
    const bar = await axios("https://api.bar.com/v1");
    user.comments = bar.data;
  } catch {
    // do nothing
  }
  return user;
}