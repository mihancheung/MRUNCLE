const app = getApp();

Page({
  data: {
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

  login (e) {
    const { detail } = e || {}
    const { userInfo } = detail || {}
    if (!userInfo) return;

    this.navigateTo();
  }

})
