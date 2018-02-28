const { SLS } = require('./sls.js');

export class Datasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.projectName = instanceSettings.jsonData.project;
    this.logstore = instanceSettings.jsonData.logstore;

    this.templateSrv = templateSrv;
    this.headers = {'Content-Type': 'application/json'}

    const defaultConfig = {
      accessKeyId: instanceSettings.jsonData.access_key_id,
      accessKeySecret: instanceSettings.jsonData.access_key_secret,

      timeout: 20 * 1000,

      signature_method: 'hmac-sha1',
      api_version: '0.6.0',
    };

    this.slsclient = new SLS(
      defaultConfig,
      backendSrv,
      instanceSettings.url
    );
  }

  query(options) {
    console.log(options);
  }
}
