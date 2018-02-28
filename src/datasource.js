const _ = require('lodash');
const { SLS } = require('./sls.js');

const DURATION_RE = /\$([0-9]+)([dhms])/g
const DURATION_UNIT_BASE = {
  d: 60 * 60 * 24,
  h: 60 * 60,
  m: 60,
  s: 1,
};

function replaceDurationUnit(query) {
  return query.replace(DURATION_RE, function(_, t, unit) {
    const base = parseInt(t, 10);
    const seconds = base * DURATION_UNIT_BASE[unit];
    return `${seconds}`;
  });
}

function patchBeginEndTime(query, range) {
  return query
    .replace('#time_end', `${range.to.unix()}`)
    .replace('#time_begin', `${range.from.unix()}`);
}

// TODO: group by string value
function transformData(datapoints, targetFields, valueField, timeField) {
  let data = datapoints.map(datapoint => {
    const time = parseInt(datapoint[timeField], 10) * 1000;
    let value = parseFloat(datapoint[valueField]);
    if (isNaN(value)) {
      value = null;
    }

    return {
      datapoint,
      value,
      time,
    };
  });
  data = _.sortBy(data, ['time']);

  return targetFields.reduce((acc, targetField) => {
    const datapointsByTargetValue = data
      .reduce((vs, { datapoint, value, time }) => {
        const target = datapoint[targetField];
        if (!target) {
          return vs;
        }

        if (!vs[target]) {
          vs[target] = [];
        }

        vs[target].push([value, time]);

        return vs;
      }, {});

    return [].concat(
      acc,
      _.map(datapointsByTargetValue, (datapoints, target) => {
        return {
          target,
          datapoints,
        };
      })
    );
  }, []);
}

export class Datasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.templateSrv = templateSrv;

    const project = instanceSettings.jsonData.project;
    const logstore = instanceSettings.jsonData.logstore;
    const regionEndpoint = instanceSettings.jsonData.region_endpoint;
    const projectBaseUrl = `http://${project}.${regionEndpoint}/`;

    this.slsclient = new SLS(
      {
        accessKeyId: instanceSettings.jsonData.access_key_id,
        accessKeySecret: instanceSettings.jsonData.access_key_secret,

        signature_method: 'hmac-sha1',
        api_version: '0.6.0',
      },
      backendSrv,
      projectBaseUrl
    );

    this.headers = {'Content-Type': 'application/json'}
    this.getData = (body) => {
      return this.slsclient.getData(logstore, body);
    };
  }

  queryTarget(options, target) {
    const range = options.range;

    let query = target.query;
    query = this.templateSrv.replace(query, {}, 'glob');
    query = replaceDurationUnit(query);
    query = patchBeginEndTime(query, range);

    return this.getData({
      topic: '',
      query,
      from: range.from.unix(),
      to: range.to.unix(),
      reverse: false,
      lines: 100,
      offset: 0,
    }).then(result => {
      if (!result.data) {
        throw new Error('data is missing');
      }

      const targetFields = (target.ycol || '').split(',').map(i => i.trim());
      return transformData(
        result.data,
        targetFields,
        target.vcol,
        target.xcol || '__time__',
      );
    })
  }

  query(options) {
    const queries = options.targets
      .filter(target => !target.hide)
      .filter(target => !!target.query)
      .map(target => this.queryTarget(options, target));

    return Promise.all(queries)
      .then(queriesData => {
        return {
          data: _.flatten(queriesData),
        }
      });
  }

  testDatasource() {
    const nowInSecond = Math.floor(Date.now() / 1000);
    return this.getData({
      topic: '',
      from: nowInSecond - 900,
      to: nowInSecond,
      query: '',
      reverse: false,
      line: 10,
      offset: 0,
    }).then(result => {
      return {
        status: 'success',
        message: 'Connection Succeed',
        title: 'Success',
      };
    }).catch(err => {
      if (err.data & err.data.message) {
        return {
          status: 'error',
          message: err.data.message,
          title: 'Error',
        };
      } else {
        return {
          status: 'error',
          message: err.status,
          title: 'Error',
        };
      }
    });
  }

  annotationQuery(options) {
    // TODO
  }

  metricFindQuery(options) {
    // TODO
  }
}
