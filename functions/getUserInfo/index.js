const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const loginInfo = db.collection('login-info');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId} = wxContext;

  // 云函数调云函数的时候拿不到当前wxContext的openId
  const res = await loginInfo.where({
    openId: event.openId || openId
  }).get().catch(() => null);

  if (!res || !res.data || !res.data[0]) {
    return {
      userInfo: {}
    }
  }

  return {
    userInfo: res.data[0]
  };
}