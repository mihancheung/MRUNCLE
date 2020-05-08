const app = getApp();

Page({
  data: {
    isLoging: false,
    desc: ''
  },

  onLoad (option) {
    const { desc } = option || {}
    this.setData({
      desc
    });
  },

  navigateTo () {
    wx.navigateBack({
      delta: 1
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

    // 重新设置全局登录状态
    app.isLogin = isLogin;

    if (!isLogin) {
      wx.showToast({
        title: 'Sorry，登入過程似乎出現咗問題',
        icon: 'none'
      });
      return;
    } else {
      wx.showToast({
        title: '得米！成功登入',
        icon: 'none'
      });
    }

    this.navigateTo();
  }

})
