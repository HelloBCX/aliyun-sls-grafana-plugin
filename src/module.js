const { Datasource } = require('./datasource.js');
const { QueryCtrl } = require('./query_ctrl.js');

class ConfigCtrl {}
ConfigCtrl.templateUrl = 'partials/config.html';

class QueryOptionsCtrl {}

export {
  Datasource,

  ConfigCtrl,
  QueryCtrl,
  QueryOptionsCtrl,
};
