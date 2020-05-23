const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const userReplyDB = db.collection('user-reply');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const {
    maxMarksLength = 10,
    orderBy = {
      key: 'date',
      type: 'desc'
    },
    skip = 0,
  } = event;

  const totalReq = userReplyDB.where({
    openId
  }).count();

  const res = await userReplyDB
    .where({
      openId
    })
    .orderBy(orderBy.key, orderBy.type)
    .skip(skip)
    .limit(maxMarksLength)
    .get()
    .catch(() => null);

  if (!res || !res.data || res.data.length === 0) {
    return {
      msgList: [],
      total: 0,
    }
  }

  const totalRes = await totalReq.catch(() => null) || {};

  return {
    msgList: res.data,
    total: totalRes.total || 0
  }
}