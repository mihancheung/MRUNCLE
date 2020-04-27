import { config } from './utils/config'

App({
  onLaunch () {
    wx.cloud.init({
      env: 'dev-c8vh9'
    })
  },

  cdnEnvBase: config.cdnDevBase,
  postAvata: `${config.cdnDevBase}/me.jpeg`,
  postAuthor: 'MRUNCLE',
  towxml:require('/towxml/index'),

  wxRequire (opt) {
    return new Promise((resolve, reject) => {
      wx.request({
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          resolve(res);
        },
        fail: function (error) {
          reject(error);
        },
        ...opt,
      });
    })
  }
})