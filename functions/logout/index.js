const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const loginInfo = db.collection('login-info');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  let isLogout = false;

  const res = await loginInfo.where({
    openId
  }).remove().catch(() => null);

  if (res) {
    isLogout = true;
  }

  return {
    isLogout
  }
}