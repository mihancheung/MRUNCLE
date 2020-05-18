const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const $ = db.command.aggregate;
const comment = db.collection('comment');

exports.main = async (event, context) => {
  const { postId } = event;

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

  // 回复评论数
  const replyRes = await replyCommentsReq.catch(() => null)
  const { list = [] } = replyRes || {}
  const { replyCommentTotal = 0 } = list[0] || {}

  // 文章非回复评论数
  const commentsRes = await commentsReq.catch(() => {});
  const { total: commentsResTotal = 0 } = commentsRes;

  return {
    comments: commentsResTotal + replyCommentTotal
  }
}