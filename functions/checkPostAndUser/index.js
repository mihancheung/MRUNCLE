const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const $ = db.command.aggregate;
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

  const isMarksReq = marks.where({
    openId,
    postId
  }).count();

  const isLikesReq = likes.where({
    openId,
    postId
  }).count();

  const marksReq = marks.where({
    postId
  }).count();

  const likesReq = likes.where({
    postId
  }).count();

  const commentsReq = comment.where({
    postId
  }).count();

  const replyCommentsReq = comment
  .aggregate()
  .match({
    postId
  })
  .group({
    _id: null,
    replyCommentTotal: $.sum($.size($.ifNull(['$replies', []])))
  })
  .end();

  const isMarksRes = await isMarksReq.catch(() => {});
  const isLikesRes = await isLikesReq.catch(() => {});
  const marksRes = await marksReq.catch(() => {});
  const likesRes = await likesReq.catch(() => {});

  // 回复评论数
  const replyRes = await replyCommentsReq.catch(() => null)
  const { list = [] } = replyRes || {}
  const { replyCommentTotal = 0 } = list[0] || {}

  // 文章非回复评论数
  const commentsRes = await commentsReq.catch(() => {});

  // 用戶是否收藏文章
  if (isMarksRes.total === 0) {
    isMark = false
  }

  // 用戶是否點贊文章
  if (isLikesRes.total === 0) {
    isLike = false;
  }

  return {
    isMark,
    isLike,
    postInfo: {
      marks: marksRes.total || 0,
      likes: likesRes.total || 0,
      comments: (commentsRes.total + replyCommentTotal) || 0
    }
  }
}