const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const $ = db.command.aggregate;
const commentDB = db.collection('comment');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId} = wxContext;

  const {
    postId,
    orderBy = {
      key: 'date',
      type: -1
    },
    skip = 0,
    maxCommentList = 10
  } = event;

  const totalReq = commentDB
    .where({
      postId,
    }).count();

  const listReq = commentDB
    .aggregate()
    .match({
      postId
    })
    .sort({
      [orderBy.key]: orderBy.type
    })
    .skip(skip)
    .limit(maxCommentList)
    .project({
      avatarUrl: 1,
      cnt: 1,
      date: 1,
      nickName: 1,
      openId: 1,
      postId: 1,
      replies: $.slice([$.ifNull(['$replies', []]), 0, 3]),
      replyTotal: $.size($.ifNull(['$replies', []]))
    })
    .end();

  let total = 0
  const totalRes = await totalReq.catch(() => null);
  if (totalRes) {
    total = totalRes.total;
  }

  const listRes = await listReq.catch(() => null);

  if (!listRes || !listRes.list) {
    return {
      list: null,
      total,
      openId,
    }
  }

  return {
    list: listRes.list,
    total: totalRes.total,
    openId,
  }
}