const app = getApp();

Page({
  data: {
    isLoging: false
  },

  onLoad (option) {
    const { path, tabbar } = option || {}
    this.path = path;
    this.isTabBar = tabbar;
  },

  navigateTo () {
    if (this.isTabBar) {
      wx.switchTab({
        url: this.path
      });
      return;
    }

    wx.redirectTo({
      url: this.path
    });
  },

  _setIsLoging (isLoging) {
    this.setData({
      isLoging
    });
  },

  async login (e) {
    const { detail } = e || {};
    const { userInfo } = detail || {};

    // 用户拒绝授权
    if (!userInfo) return;

    this._setIsLoging(true);

    const loginRes = await wx.cloud.callFunction({
      name: 'login',
      data: {
        userInfo
      }
    }).catch(() => null);

    this._setIsLoging(false);

    const { result } = loginRes || {};
    const { isLogin } = result || {};

    if (!isLogin) {
      wx.showToast({
        title: 'Sorry，登入過程似乎出現咗問題',
        icon: 'none'
      });
      return;
    }

    this.navigateTo();
  }

})
