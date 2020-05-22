const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const loginInfo = db.collection('login-info');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { userInfo } = event
  let isLogin = false;

  const res = await loginInfo.doc(openId).set({
    data: {
      ...userInfo,
      openId,
    }
  }).catch(() => null);

  if (res) {
    isLogin = true;
  }

  return {
    isLogin,
    openId
  }
}