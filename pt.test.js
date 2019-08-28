const unmock = require("./lib");
const { check } = unmock;
const getUser = require("./pt");

test("foo and bar", async () => {
  const { fooapi, barapi } = unmock.on().services;
  check(fooapi.succeeds, barapi.succeeds, async (um) => {
    const user = await getUser();
    expect(user).toMatchObject(um.fooapi.responseBody);
    expect(user.comments).toEqual(um.barapi.responseBody);
  });
})