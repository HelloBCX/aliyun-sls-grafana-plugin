'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./datasource.js'),
    Datasource = _require.Datasource;

var ConfigCtrl = function ConfigCtrl() {
  _classCallCheck(this, ConfigCtrl);
};

ConfigCtrl.templateUrl = 'partials/config.html';

var QueryCtrl = function QueryCtrl() {
  _classCallCheck(this, QueryCtrl);
};

var QueryOptionsCtrl = function QueryOptionsCtrl() {
  _classCallCheck(this, QueryOptionsCtrl);
};

exports.Datasource = Datasource;
exports.ConfigCtrl = ConfigCtrl;
exports.QueryCtrl = QueryCtrl;
exports.QueryOptionsCtrl = QueryOptionsCtrl;