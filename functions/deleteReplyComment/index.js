const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const commentDB = db.collection('comment');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { commentId, replyId } = event

  const res = await commentDB.doc(commentId).update({
    data: {
      replies: _.pull({
        _id: replyId,
        openId,
      })
    }
  }).catch(() => null);

  if (!res) return;

  return {
    res
  }
}