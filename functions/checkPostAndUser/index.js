const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const marks = db.collection('marks');
const likes = db.collection('likes');
const comment = db.collection('comment');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { postId } = event;
  let isMark = true;
  let isLike = true;

  const marksReq = marks.where({
    openId,
    postId
  }).count();

  const likesReq = likes.where({
    openId,
    postId
  }).count();

  const commentsReq = comment.where({
    postId
  }).count();

  const marksRes = await marksReq.catch(() => {});
  const likesRes = await likesReq.catch(() => {});

  // 文章评论数
  const commentsRes = await commentsReq.catch(() => {});

  // 用戶是否收藏文章
  if (marksRes.total === 0) {
    isMark = false
  }

  // 用戶是否點贊文章
  if (likesRes.total === 0) {
    isLike = false;
  }

  return {
    isMark,
    isLike,
    postInfo: {
      marks: marksRes.total || 0,
      likes: likesRes.total || 0,
      comments: commentsRes.total || 0
    }
  }
}