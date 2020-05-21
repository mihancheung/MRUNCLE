const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const commentDB = db.collection('comment');

exports.main = async (event, context) => {
  const { id, postId } = event;
  if (!id || !postId) return;

  const res = await commentDB.doc(id).remove().catch(() => null);

  if (!res) return;

  // 拿最新的评论总数
  let total = {}
  const totalRes = await commentDB.where({
    postId
  }).count();

  if (totalRes) {
    total = {
      total: totalRes.total || 0
    }
  }

  return {
    res,
    ...total
  }
}