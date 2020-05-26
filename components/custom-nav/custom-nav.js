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
    isShowBack: true,
    statusBarHeigth: wx.getSystemInfoSync().statusBarHeight,
    statusBarTitleHeigth: ((wx.getMenuButtonBoundingClientRect().top - wx.getSystemInfoSync().statusBarHeight) * 2) + wx.getMenuButtonBoundingClientRect().height,
    menuBtnRight: wx.getSystemInfoSync().screenWidth - wx.getMenuButtonBoundingClientRect().right
  },

  lifetimes: {
    attached () {
      const routes = getCurrentPages()
      const isLoginScene = routes.length >= 2 && routes[routes.length - 1].route === 'pages/login/login' && routes[routes.length - 2].route === 'pages/user/user'
      if (routes.length === 1 || isLoginScene) {
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