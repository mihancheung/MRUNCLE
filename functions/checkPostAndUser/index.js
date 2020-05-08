const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const user = db.collection('user');
const post = db.collection('post');
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { postId } = event;
  let isMark = true;
  let isLike = true;
  let postInfo = null;

  const isMarkReq = user.where({
    openId,
    markPosts: _.elemMatch(_.eq(postId))
  }).get();

  const isLikeReq = user.where({
    openId,
    likePosts: _.elemMatch(_.eq(postId))
  }).get();

  // 用戶是否收藏文章
  const isMarkRes = await isMarkReq.catch(() => null);

  // 用戶是否點贊文章
  const isLikeRes = await isLikeReq.catch(() => null);

  if (!isMarkRes || !isMarkRes.data || isMarkRes.data.length === 0) {
    isMark = false
  }

  if (!isLikeRes || !isLikeRes.data || isLikeRes.data.length === 0) {
    isLike = false;
  }

  // 文章信息
  const postRes = await post.where({
    _id: postId
  })
  .field({
    comments: true,
    likes: true,
    marks: true
  })
  .get()
  .catch(() => null);

  if (postRes && postRes.data) {
    postInfo = postRes.data[0];
  }


  return {
    isMark,
    isLike,
    postInfo
  }
}