const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const user = db.collection('user');
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { markPosts = [], likePosts = [], type = 'add' } = event;

  const add = (addArr) => {
    return _.addToSet({
      $each: addArr
    });
  }

  const cancel = (cancelArr) => {
    return _.pull(_.in(cancelArr))
  }

  // 查詢是否存用戶記錄是否存在
  const isExistRes = await user.where({
    openId
  }).get().catch(() => null);

  if (!isExistRes) {
    return {
      res: null
    };
  }

  let updateReq = null;

  // 無數據需新插入
  if (isExistRes.data.length === 0) {
    updateReq = user.add({
      data: {
        markPosts,
        likePosts,
        openId,
      }
    });
  } else {
    updateReq = user.where({
      openId
    }).update({
      data: {
        markPosts: type === 'cancel' ? cancel(markPosts) : add(markPosts),
        likePosts: type === 'cancel' ? cancel(likePosts) : add(likePosts),
        openId,
      }
    });
  }

  let res = await updateReq.catch(() => null);

  if (!res) {
    res = null
  }

  return {
    res,
  };
}