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
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
    isShowBack: true,
  },

  lifetimes: {
    attached () {
      if (getCurrentPages().length === 1) {
        this.setData({
          isShowBack: false
        });
      }
    }
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