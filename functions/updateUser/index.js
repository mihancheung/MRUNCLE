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
  const { markPosts = [], likePosts = [], type = 'add', updateType } = event;

  const add = (markArr) => {
    return _.addToSet({
      $each: markArr
    });
  }

  const cancle = (unmarkArr) => {
    return _.pull(_.in(unmarkArr))
  }

  let res = await user.where({
    openId
  })[updateType || 'update']({
    data: {
      markPosts: type === 'cancle' ? cancle(markPosts) : add(markPosts),
      likePosts: type === 'cancle' ? cancle(likePosts) : add(likePosts),
    }
  }).catch(() => null);

  if (!res) {
    res = null
  }

  return {
    res
  };
}