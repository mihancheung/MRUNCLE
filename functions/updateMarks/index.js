const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const marks = db.collection('marks');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { postId, type = 'add' } = event;

  if (!openId || !postId) return;

  let req = null;

  if (type === 'delete') {
    req = marks.where({
      openId,
      postId,
    }).remove();
  } else {
    req = marks.add({
      data: {
        openId,
        postId,
        date: new Date()
      }
    });
  }

  const res = await req.catch(() => null);

  if (!res) return;

  // 返回mark总数
  let total = {}
  const totalRes = await marks.where({
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