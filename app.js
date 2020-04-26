App({
  onLaunch () {
    wx.cloud.init({
      env: 'dev-c8vh9'
    })
  },

  postAvata: 'cloud://release-vp8ak.7265-release-vp8ak-1301890037/me.jpeg',
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