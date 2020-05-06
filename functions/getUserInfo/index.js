const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId,  UNIONID: unionId} = wxContext;

  return {
    openId,
    unionId,
  };
}