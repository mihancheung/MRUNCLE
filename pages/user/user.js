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
    if (!app.isConnected) {
      wx.stopPullDownRefresh();
      this._setError();
      return;
    }

    this._resetPage(this._init);
  },

  onReachBottom () {
    if (this.data.tab === 'mark' && this.cmtMarkList && typeof this.cmtMarkList.onReachBottom === 'function') {
      this.cmtMarkList.onReachBottom();
    }

    this.msg = this.selectComponent('#msg') 
    if (this.data.tab === 'msg' && this.msg && typeof this.msg.onReachBottom === 'function') {
      this.msg.onReachBottom();
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

      if (this.data.tab === 'msg') {
        this.msg = this.selectComponent('#msg');
      }
    });
  },

  onErrorReload () {
    if (!app.isConnected) {
      return;
    }
    this._resetPage(this._init);
  },

  async _init () {
    if (this.data.userInfo) return;

    if (!app.isConnected) {
      this._setError();
      return;
    }

    const openIdRes = await wx.getStorage({
      key: 'OPENID'
    }).catch(() => null);
    const { data: openId } = openIdRes || {}

    if (!app.isLogin && !openId) {
      wx.navigateTo({
        url: `/login/pages/login/login?desc=查看我的主頁需要提供登入信息`
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
    wx.showLoading({
      title: '正在退出'
    });

    const res = await wx.cloud.callFunction({
      name: 'logout'
    }).catch(() => null);

    wx.hideLoading();

    const { result } = res || {};
    const { isLogout } = result || {};

    if (!isLogout) {
      wx.showToast({
        title: '登出似乎未成功',
        icon: 'none'
      });
      return;
    }

    app.isLogin = !isLogout;

    wx.removeStorage({
      key: 'OPENID',
    });

    wx.removeStorage({
      key: 'userInfo',
    });

    if (res) {
      wx.reLaunch({
        url: '/pages/user/user'
      });
    }
  },

  _setError () {
    this.setData({
      isError: true,
      isLoading: false,
    });
  },

  async _setUserInfo () {
    const userInfoRes = await wx.getStorage({
      key: 'userInfo'
    }).catch(() => null);
    const { data: userInfo } = userInfoRes || {}

    // 登录存storage的用户信息
    if (userInfo) {
      this.setData({
        isLogin: true,
        isLoading: false,
        userInfo
      });
      return;
    }

    // 兜底异常，从云端拿用户数据
    const res = await wx.cloud.callFunction({
      name: 'getUserInfo',
    });

    const { result } = res || {}
    const { userInfo: cloudUserInfo } = result || {}

    this.setData({
      isLogin: true,
      isLoading: false,
      userInfo: cloudUserInfo
    });
  }
});
