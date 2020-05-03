import { config } from './utils/config'

App({
  onLaunch () {
    wx.cloud.init({
      env: 'dev-c8vh9'
    });

    this.watchNetworkStatus()
  },

  cdnEnvBase: config.cdnDevBase,
  postAvata: '/image/me.jpeg',
  postAuthor: 'MRUNCLE',
  towxml:require('/towxml/index'),
  isConnected: true,

  watchNetworkStatus () {
    wx.onNetworkStatusChange(function(res) {
      this.isConnected = res.isConnected
    }.bind(this));
  },

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