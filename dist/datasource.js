'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./sls.js'),
    SLS = _require.SLS;

var Datasource = exports.Datasource = function () {
  function Datasource(instanceSettings, $q, backendSrv, templateSrv) {
    _classCallCheck(this, Datasource);

    this.projectName = instanceSettings.jsonData.project;
    this.logstore = instanceSettings.jsonData.logstore;

    this.templateSrv = templateSrv;
    this.headers = { 'Content-Type': 'application/json' };

    var defaultConfig = {
      accessKeyId: instanceSettings.jsonData.access_key_id,
      accessKeySecret: instanceSettings.jsonData.access_key_secret,

      timeout: 20 * 1000,

      signature_method: 'hmac-sha1',
      api_version: '0.6.0'
    };

    this.slsclient = new SLS(defaultConfig, backendSrv, instanceSettings.url);
  }

  _createClass(Datasource, [{
    key: 'query',
    value: function query(options) {
      console.log(options);
    }
  }]);

  return Datasource;
}();