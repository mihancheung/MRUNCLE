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
    commentId,
    skip = 0,
    maxCommentList = 10
  } = event;

  const res = await commentDB
    .aggregate()
    .match({
      _id: commentId
    })
    .project({
      avatarUrl: 1,
      cnt: 1,
      date: 1,
      nickName: 1,
      openId: 1,
      postId: 1,
      replies: $.slice(['$replies', skip, maxCommentList]),
      total: $.size('$replies')
    })
    .end()
    .catch(() => null);

  if (!res || res.list.length === 0) {
    return {
      list: null,
      total: 0,
    }
  }

  return {
    replyCommentInfo: res.list[0],
    total: res.list[0].total,
    openId,
    commentOpenId: res.list[0].openId
  }
}