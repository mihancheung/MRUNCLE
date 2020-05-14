const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const post = db.collection('post');

exports.main = async (event, context) => {
  if (!event.updateData) return;

  // 更新文章信息
  const res = await post.doc(event.postId).update({
    data: event.updateData
  }).catch(() => null);

  return {
    res
  }
}