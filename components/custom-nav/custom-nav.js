Component({
  properties: {
    home: {
      type: Boolean,
      value: true,
    },

    back: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight
  },

  methods: {
    backHome: function () {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    },

    back: function () {
      wx.navigateBack({
        delta: 1
      });
    }
  }
});