App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'dev-c8vh9'
    })
  },

  towxml:require('/towxml/index')
})