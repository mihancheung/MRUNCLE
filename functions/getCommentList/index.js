const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const commentDB = db.collection('comment');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId} = wxContext;

  const {
    postId,
    orderBy = {
      key: 'date',
      type: 'asc'
    },
    skip = 0,
    maxCommentList = 10
  } = event;

  const totalReq = commentDB
    .where({
      postId,
    }).count();

  const listReq = commentDB
    .where({
      postId,
    })
    .orderBy(orderBy.key, orderBy.type)
    .skip(skip)
    .limit(maxCommentList)
    .get();

  let total = 0
  const totalRes = await totalReq.catch(() => null);
  if (totalRes) {
    total = totalRes.total;
  }

  const listRes = await listReq.catch(() => null);

  if (!listRes || !listRes.data) {
    return {
      list: null,
      total
    }
  }

  return {
    list: listRes.data,
    total: totalRes.total,
    openId,
  }
}