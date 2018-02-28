const { QueryCtrl: BaseQueryCtrl } = require('app/plugins/sdk');

export class QueryCtrl extends BaseQueryCtrl {

  constructor($scope, $injector) {
    super($scope, $injector);

    this.$scope = $scope;
  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  onChangeInternal() {
    this.panelCtrl.refresh();
  }

}

QueryCtrl.templateUrl = 'partials/query.editor.html';
