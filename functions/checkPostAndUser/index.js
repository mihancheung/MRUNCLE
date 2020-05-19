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

  const marksReq = marks
    .aggregate()
    .match({
      postId
    })
    .group({
      _id: null,
      marksTotal: $.sum(1),
      openIds: $.addToSet('$openId')
    })
    .project({
      marksTotal: '$marksTotal',
      isMark: $.in([openId, '$openIds'])
    })
    .end();

  const likesReq = likes
    .aggregate()
    .match({
      postId
    })
    .group({
      _id: null,
      likesTotal: $.sum(1),
      openIds: $.addToSet('$openId')
    })
    .project({
      likesTotal: '$likesTotal',
      isLike: $.in([openId, '$openIds'])
    })
    .end();

  
  const commentsReq = comment
    .aggregate()
    .match({
      postId
    })
    .group({
      _id: null,
      commentsTotal: $.sum(1),
      replyCommentTotal: $.sum($.size($.ifNull(['$replies', []])))
    })
    .end();

  const marksRes = await marksReq.catch(() => {});
  const likesRes = await likesReq.catch(() => {});
  const commentsRes = await commentsReq.catch(() => {});

  // 收藏相关
  const { list: marksList = [] } = marksRes || {}
  const { marksTotal = 0, isMark } = marksList[0] || {}

  // 点赞相关
  const { list: likesList = [] } = likesRes || {}
  const { likesTotal = 0, isLike } = likesList[0] || {}

  // 评论相关
  const { list: commentsList = [] } = commentsRes || {}
  const { commentsTotal = 0, replyCommentTotal = 0 } = commentsList[0] || {}

  return {
    isMark,
    isLike,
    postInfo: {
      marks: marksTotal || 0,
      likes: likesTotal || 0,
      comments: (commentsTotal + replyCommentTotal) || 0
    }
  }
}