import { config } from './utils/config';

App({
  onLaunch () {
    wx.cloud.init({
      env: config.cloudEnv
    });

    wx.onNetworkStatusChange(function(res) {
      this.isConnected = res.isConnected
    }.bind(this));

    this._setIsLogin();
  },

  isConnected: true,

  async _setIsLogin () {
    const openIdRes = await wx.getStorage({
      key: 'OPENID'
    }).catch(() => null);
    const { data: openId } = openIdRes || {}
    if (!openId) return;
    this.isLogin = true;
  },
})