const app = getApp();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    isError: false,
    isLoading: false,
    markPage: 0
  },

  onLoad () {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    this.route = `/${currentPage.route}`;
  },

  onShow () {
    this.checkIsLogin();
  },

  onReachBottom () {},

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

    const res = await wx.getSetting();
    if (!res.authSetting['scope.userInfo']) {
      wx.navigateTo({
        url: `/pages/login/login?path=${this.route}&tabbar=1`
      });
      return;
    }

    this.handleCheckDoneAndLoading();
  }
});
