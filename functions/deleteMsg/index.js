const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const userReplyDB = db.collection('user-reply');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { id } = event;
  if (!id) return;

  const res = await userReplyDB.doc(id).remove().catch(() => null);

  if (!res) return;

  const totalRes = await userReplyDB.where({
    openId
  })
  .count()
  .catch(() => null) || {};

  return {
    res,
    total: totalRes.total || 0
  }
}