App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'dev-c8vh9'
    })
  },

  postAvata: 'cloud://release-vp8ak.7265-release-vp8ak-1301890037/me.jpeg',
  postAuthor: 'MRUNCLE',
  towxml:require('/towxml/index')
})