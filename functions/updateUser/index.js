const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const user = db.collection('user');
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId} = wxContext;
  const { markPosts = [], likePosts = [], isMark } = event;

  const mark = (markArr) => {
    return _.addToSet({
      $each: markArr
    });
  }

  const unmark = (unmarkArr) => {
    return _.pull(_.in(unmarkArr))
  }

  let res = await user.where({
    openId
  })[event.type || 'update']({
    data: {
      markPosts: isMark ? unmark(markPosts) : mark(markPosts),
      likePosts: isMark ? unmark(likePosts) : mark(likePosts),
    }
  }).catch(() => null);

  if (!res) {
    res = null
  }

  return {
    res
  };
}