const app = getApp();

Page({
  data: {
    tab: 'msg',
    isLogin: false,
    userInfo: null,
    isError: false,
    isLoading: true,
    markPage: 0,
    isInitMarkTab: false,
  },

  onShow () {
    this._init();
  },

  onPullDownRefresh () {
    this._resetPage(this._init);
  },

  onReachBottom () {
    this.cmtMarkList && typeof this.cmtMarkList.onReachBottom === 'function' && this.cmtMarkList.onReachBottom();
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

  onTapTab (e) {
    let isInitMarkTab = {};
    if (!this.data.isInitMarkTab) {
      isInitMarkTab.isInitMarkTab = true;
    }
    this.setData({
      tab: e.currentTarget.dataset.tab,
      ...isInitMarkTab,
    }, () => {
      if (this.data.tab === 'mark') {
        this.cmtMarkList = this.selectComponent('#marklist');
      }
    });
  },

  async _init () {
    if (this.data.userInfo) return;

    if (app.isLogin) {
      this._setUserInfo();
      return;
    }

    const res = await wx.cloud.callFunction({
      name: 'isLogin'
    }).catch(() => null);

    if (!res || !res.result.isLogin) {
      wx.navigateTo({
        url: `/pages/login/login?desc=查看我的主頁需要提供登入信息`
      });
      return;
    }

    this._setUserInfo();
  },

  _resetPage (cb) {
    this.setData({
      tab: 'msg',
      isLogin: false,
      userInfo: null,
      isError: false,
      isLoading: true,
      markPage: 0,
      isInitMarkTab: false,
    }, () => {
      wx.stopPullDownRefresh();
      typeof cb === 'function' && cb();
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

  _setError () {
    this.setData({
      isError: false,
      isLoading: false,
    });
  },

  async _setUserInfo () {
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
  }
});
