'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var _require = require('./sls.js'),
    SLS = _require.SLS;

var DURATION_RE = /\$([0-9]+)([dhms])/g;
var DURATION_UNIT_BASE = {
  d: 60 * 60 * 24,
  h: 60 * 60,
  m: 60,
  s: 1
};

function replaceDurationUnit(query) {
  return query.replace(DURATION_RE, function (_, t, unit) {
    var base = parseInt(t, 10);
    var seconds = base * DURATION_UNIT_BASE[unit];
    return '' + seconds;
  });
}

function patchBeginEndTime(query, range) {
  return query.replace('#time_end', '' + range.to.unix()).replace('#time_begin', '' + range.from.unix());
}

// TODO: group by string value
function transformData(datapoints, targetFields, valueField, timeField) {
  var data = datapoints.map(function (datapoint) {
    var time = parseInt(datapoint[timeField], 10) * 1000;
    var value = parseFloat(datapoint[valueField]);
    if (isNaN(value)) {
      value = null;
    }

    return {
      datapoint: datapoint,
      value: value,
      time: time
    };
  });
  data = _.sortBy(data, ['time']);

  return targetFields.reduce(function (acc, targetField) {
    var datapointsByTargetValue = data.reduce(function (vs, _ref) {
      var datapoint = _ref.datapoint,
          value = _ref.value,
          time = _ref.time;

      var target = datapoint[targetField];
      if (!target) {
        return vs;
      }

      if (!vs[target]) {
        vs[target] = [];
      }

      vs[target].push([value, time]);

      return vs;
    }, {});

    return [].concat(acc, _.map(datapointsByTargetValue, function (datapoints, target) {
      return {
        target: target,
        datapoints: datapoints
      };
    }));
  }, []);
}

var Datasource = exports.Datasource = function () {
  function Datasource(instanceSettings, $q, backendSrv, templateSrv) {
    var _this = this;

    _classCallCheck(this, Datasource);

    this.templateSrv = templateSrv;

    var project = instanceSettings.jsonData.project;
    var logstore = instanceSettings.jsonData.logstore;
    var regionEndpoint = instanceSettings.jsonData.region_endpoint;
    var projectBaseUrl = 'http://' + project + '.' + regionEndpoint + '/';

    this.slsclient = new SLS({
      accessKeyId: instanceSettings.jsonData.access_key_id,
      accessKeySecret: instanceSettings.jsonData.access_key_secret,

      signature_method: 'hmac-sha1',
      api_version: '0.6.0'
    }, backendSrv, projectBaseUrl);

    this.headers = { 'Content-Type': 'application/json' };
    this.getData = function (body) {
      return _this.slsclient.getData(logstore, body);
    };
  }

  _createClass(Datasource, [{
    key: 'queryTarget',
    value: function queryTarget(options, target) {
      var range = options.range;

      var query = target.query;
      query = this.templateSrv.replace(query, {}, 'glob');
      query = replaceDurationUnit(query);
      query = patchBeginEndTime(query, range);

      return this.getData({
        topic: '',
        query: query,
        from: range.from.unix(),
        to: range.to.unix(),
        reverse: false,
        lines: 100,
        offset: 0
      }).then(function (result) {
        if (!result.data) {
          throw new Error('data is missing');
        }

        var targetFields = (target.ycol || '').split(',').map(function (i) {
          return i.trim();
        });
        return transformData(result.data, targetFields, target.vcol, target.xcol || '__time__');
      });
    }
  }, {
    key: 'query',
    value: function query(options) {
      var _this2 = this;

      var queries = options.targets.filter(function (target) {
        return !target.hide;
      }).filter(function (target) {
        return !!target.query;
      }).map(function (target) {
        return _this2.queryTarget(options, target);
      });

      return Promise.all(queries).then(function (queriesData) {
        return {
          data: _.flatten(queriesData)
        };
      });
    }
  }, {
    key: 'testDatasource',
    value: function testDatasource() {
      var nowInSecond = Math.floor(Date.now() / 1000);
      return this.getData({
        topic: '',
        from: nowInSecond - 900,
        to: nowInSecond,
        query: '',
        reverse: false,
        line: 10,
        offset: 0
      }).then(function (result) {
        return {
          status: 'success',
          message: 'Connection Succeed',
          title: 'Success'
        };
      }).catch(function (err) {
        if (err.data & err.data.message) {
          return {
            status: 'error',
            message: err.data.message,
            title: 'Error'
          };
        } else {
          return {
            status: 'error',
            message: err.status,
            title: 'Error'
          };
        }
      });
    }
  }, {
    key: 'annotationQuery',
    value: function annotationQuery(options) {
      // TODO
    }
  }, {
    key: 'metricFindQuery',
    value: function metricFindQuery(options) {
      // TODO
    }
  }]);

  return Datasource;
}();