import { config } from './utils/config';

App({
  onLaunch () {
    wx.cloud.init({
      env: config.cloudEnv
    });

    this.watchNetworkStatus();
    this._setIsLogin();
  },

  cdnBase: config.cdnBase,
  postAvata: '/image/me.jpeg',
  postAuthor: 'MRUNCLE',
  towxml:require('/towxml/index'),
  isConnected: true,

  async _setIsLogin () {
    const openIdRes = await wx.getStorage({
      key: 'OPENID'
    }).catch(() => null);

    const { data: openId } = openIdRes || {}

    // 如果缓存数据有登录状态
    if (!openId) return;
    this.isLogin = true;
  },

  watchNetworkStatus () {
    wx.onNetworkStatusChange(function(res) {
      this.isConnected = res.isConnected
    }.bind(this));
  },

  showNoNetworkToast () {
    wx.showToast({
      title: '大禍，你嘅網絡 off 咗',
      icon: 'none',
      duration: 2500
    });
  }
})