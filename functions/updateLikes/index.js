const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const likes = db.collection('likes');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { postId, type = 'add' } = event;

  if (!openId || !postId) return;

  let req = null;

  if (type === 'delete') {
    req = likes.where({
      openId,
      postId,
    }).remove();
  } else {
    req = likes.add({
      data: {
        openId,
        postId,
        date: new Date()
      }
    });
  }

  const res = await req.catch(() => null);

  if (!res) return;

  // 返回likes总数
  let total = {}
  const totalRes = await likes.where({
    postId,
  }).count();

  if (totalRes) {
    total = {
      total: totalRes.total
    };
  }


  return {
    ...total
  }
}