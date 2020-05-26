import { config } from './utils/config';

App({
  onLaunch () {
    wx.cloud.init({
      env: config.cloudEnv,
      traceUser: true
    });

    wx.onNetworkStatusChange(function(res) {
      this.isConnected = res.isConnected
    }.bind(this));

    this._setIsLogin();
  },

  isConnected: true,

  async _setIsLogin () {
    const key = config.isDev ? 'OPENID_DEV' : 'OPENID_PRO';
    const openIdRes = await wx.getStorage({
      key
    }).catch(() => null);
    const { data: openId } = openIdRes || {}
    if (!openId) return;
    this.isLogin = true;
  },
})