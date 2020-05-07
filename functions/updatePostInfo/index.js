const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const post = db.collection('post');

exports.main = async (event, context) => {
  if (!event.updateData) return;

  // 更新文章信息
  const res = await post.doc(event.postId)[event.type || 'update']({
    data: event.updateData
  }).catch(() => null);

  if (!res) {
    return {
      postInfo: null
    }
  }

  // 拿最新的文章信息
  const postInfoRes = await post.where({
    _id: event.postId
  })
  .field({
    comments: true,
    likes: true,
    marks: true
  })
  .get()
  .catch(() => null);

  if (!postInfoRes || !postInfoRes.data) {
    return {
      postInfo: null
    }
  };

  const postInfo = postInfoRes.data[0]

  return {
    postInfo,
    msg: `文章信息已更新`
  }
}