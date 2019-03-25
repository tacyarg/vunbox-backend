const lodash = require("lodash");
const moment = require("moment");

exports.defaultHourly = function(stats) {
  return lodash.defaults(stats, {
    done: false,
    name: "hourly",
    start: moment()
      .startOf("hour")
      .valueOf(),
    end: moment()
      .endOf("hour")
      .valueOf()
  });
};
exports.defaultDaily = function(stats) {
  return lodash.defaults(stats, {
    done: false,
    name: "daily",
    start: moment()
      .startOf("day")
      .valueOf(),
    end: moment()
      .endOf("day")
      .valueOf()
  });
};
exports.defaultWeekly = function(stats) {
  return lodash.defaults(stats, {
    done: false,
    name: "weekly",
    start: moment()
      .startOf("week")
      .valueOf(),
    end: moment()
      .endOf("week")
      .valueOf()
  });
};
exports.defaultMonthly = function(stats) {
  return lodash.defaults(stats, {
    done: false,
    name: "monthly",
    start: moment()
      .startOf("month")
      .valueOf(),
    end: moment()
      .endOf("month")
      .valueOf()
  });
};
exports.defaultAllTime = function(stats) {
  return lodash.defaults(stats, {
    done: false,
    name: "allTime",
    start: 0,
    end: 99999999999999999999
  });
};

exports.generateDefaults = function(name) {
  switch (name) {
    case "hourly":
      return exports.defaultHourly();
    case "daily":
      return exports.defaultDaily();
    case "weekly":
      return exports.defaultWeekly();
    case "monthly":
      return exports.defaultMonthly();
    case "allTime":
      return exports.defaultAllTime();
  }
};

exports.makeID = function(start, end) {
  return [start, end].join("_");
};
