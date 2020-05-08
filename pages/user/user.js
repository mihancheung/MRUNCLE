const app = getApp();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    isError: false,
    isLoading: false,
    markPage: 0
  },

  onShow () {
    this.checkIsLogin();
  },

  onPullDownRefresh () {
    this.reloadPage();
  },

  onReachBottom () {},

  reloadPage () {
    this.resetPage(this.init);
  },

  resetPage (cb) {
    this.setData({
      isLogin: false,
      userInfo: null,
      isError: false,
      isLoading: false,
    }, () => {
      wx.stopPullDownRefresh();
      this.checkIsLogin();
    });
  },

  async _toLogout () {
    const res = await wx.cloud.callFunction({
      name: 'logout'
    }).catch(() => null);

    const { result } = res || {};
    const { isLogout } = result || {};
    app.isLogin = !isLogout;

    if (res) {
      wx.reLaunch({
        url: '/pages/user/user'
      });
    }
  },

  onTapAvata () {
    wx.showActionSheet({
      itemList: ['退出登入'],
      itemColor: '#232323',
      success: (res) => {
        if (res.tapIndex === 0) {
          this._toLogout();
        }
      }
    });
  },

  setError () {
    this.setData({
      isError: false,
      isLoading: false,
    });
  },

  handleCheckDone () {
    this.setData({
      isLoading: true,
    }, () => {
      this.setUserInfo();
    })
  },

  async setUserInfo () {
    const res = await wx.cloud.callFunction({
      name: 'getUserInfo',
    });

    const { result } = res || {}
    const { userInfo } = result || {}

    this.setData({
      isLogin: true,
      isLoading: false,
      userInfo
    });
  },

  async checkIsLogin () {
    if (this.data.userInfo) return;

    if (!app.isLogin) {
      wx.navigateTo({
        url: `/pages/login/login?desc=查看我的主頁需要提供登入信息`
      });
      return;
    }

    this.handleCheckDone();
  }
});
