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

  onReachBottom () {},

  async toLogout () {
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
    wx.showModal({
      title: '是否退出登入？',
      success: (res) => {
        if (res.cancel) return;
        this.toLogout();
      }
    });
  },

  setError () {
    this.setData({
      isError: false,
      isLoading: false,
    });
  },

  handleCheckDoneAndLoading () {
    this.setData({
      isLoading: true
    }, () => {
      this.setUserInfo();
    })
  },

  async setUserInfo () {
    const reqUserInfo = wx.getUserInfo();
    const reqUserOpenId = wx.cloud.callFunction({
      name: 'getUserInfo',
    });

    const userInfoRes = await reqUserInfo.catch(() => null);
    const cloudRes = await reqUserOpenId.catch(() => null);

    const { userInfo } = userInfoRes || {};
    const { result } = cloudRes || {}

    if (!userInfo || !result || !result.openId) {
      this.setError();
      return;
    }

    this.setData({
      isLoading: false,
      isLogin: true,
      userInfo: {
        ...userInfo,
        openId: result.openId,
      }
    });
  },

  async checkIsLogin () {
    if (this.data.userInfo) return;

    if (!app.isLogin) {
      wx.navigateTo({
        url: `/pages/login/login`
      });
      return;
    }

    this.handleCheckDoneAndLoading();
  }
});
