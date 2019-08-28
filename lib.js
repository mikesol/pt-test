const fc = require('fast-check');
const nock = require('nock');

const SUCCEEDS = "SUCCEEDS";
const FAILS = "FAILS";
const DETERMINISTIC = "DETERMINISTIC";

const fooapi = {
  succeeds: "fooapi_SUCCEEDS",
  fails: "fooapi_FAILS"
};

const barapi = {
  succeeds: "barapi_SUCCEEDS",
  fails: "barapi_FAILS"
}

const ascribeBehavior = (args, name) => args.indexOf(name+"_"+SUCCEEDS) !== -1
  ? SUCCEEDS
  : args.indexOf(name+"_"+FAILS) !== -1
  ? FAILS
  : DETERMINISTIC;

module.exports = {
  check: (...args) => {
    const foo_behavior = ascribeBehavior(args, "fooapi");
    const bar_behavior = ascribeBehavior(args, "barapi");
    const foo_success_props = [
      fc.integer(18,99),
      fc.string(),
      fc.integer(0),
      fc.oneof(fc.constant("Running"), fc.constant("Fishing"), fc.constant("Reading"))
    ];
    const foo_failure_props = [
      fc.integer(400,599)
    ];
    const foo_default_props = {
      age: 15,
      name: "Bob",
      id: 42,
      hobby: "Running"
    }
    const bar_success_props = [
      fc.array(fc.string())
    ];
    const bar_failure_props = [
      fc.integer(400,599)
    ];
    const bar_default_props = {
      comments: [
        "Cool",
        "Far out!",
        "Rad"
      ]
    };
    const props = (foo_behavior === SUCCEEDS
      ? foo_success_props
      : foo_behavior === FAILS
      ? foo_failure_props
      : [fc.constant(foo_default_props)])
      .concat(bar_behavior === SUCCEEDS
        ? bar_success_props
        : bar_behavior === FAILS
        ? bar_failure_props
        : [fc.constant(bar_default_props)]).concat([(...inner) => {
          const barOffset = foo_behavior === SUCCEEDS ? 4 : 1;
          const um = {
            fooapi:{responseBody:undefined},
            barapi:{responseBody:undefined}
          };
          um.fooapi.responseBody = undefined;
          if (foo_behavior === SUCCEEDS) {
            um.fooapi.responseBody = {
              age: inner[0],
              name: inner[1],
              id: inner[2],
              hobby: inner[3],
            };
            nock("https://api.foo.com")
              .get("/v1")
              .reply(200, um.fooapi.responseBody);
          } else if (foo_behavior === FAILS) {
            um.fooapi.responseBody = inner[0]
            nock("https://api.foo.com")
              .get("/v1")
              .reply(um.fooapi.responseBody);
          } else {
            nock("https://api.foo.com")
              .get("/v1")
              .reply(200, inner[0]);
          }
          um.barapi.responseBody = undefined;
          um.barapi.responseBody = {
            comments: inner[barOffset]
          };
          if (bar_behavior === SUCCEEDS) {
            nock("https://api.bar.com")
              .get("/v1")
              .reply(200, um.barapi.responseBody);
          } else if (bar_behavior === FAILS) {
            nock("https://api.bar.com")
              .get("/v1")
              .reply(inner[barOffset]);
          } else {
            um.barapi.responseBody = inner[barOffset];
            nock("https://api.bar.com")
              .get("/v1")
              .reply(200);
          }
          args[args.length - 1](um);
        }]);
    fc.assert(fc.property(...props));
  },
  on: () => (
    {
      services: {
        fooapi,
        barapi
      }
    }
  )
};