const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const loginInfo = db.collection('login-info');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  let isLogin = false;

  const res = await loginInfo.where({
    openId
  }).get().catch(() => null);

  if (res && res.data && res.data.length > 0) {
    isLogin = true;
  }

  return {
    isLogin
  }
}