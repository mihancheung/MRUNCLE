const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const commentDB = db.collection('comment');
const userReplyDB = db.collection('user-reply');
const post = db.collection('post');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext
  const { cnt, id, replyTo, replyItem, replyCommentInfo } = event

  // 评论内容安全检测
  const cntCheckRes = await cloud.openapi.security.msgSecCheck({
    content: cnt
  }).catch((error) => error);

  if (!cntCheckRes) {
    return {
      commentInfo: null
    }
  }

  // 敏感违规内容
  const { errCode } = cntCheckRes
  if (errCode === 87014) {
    return {
      commentInfo: null,
      cntMsg: '内容含有违法违规内容'
    }
  }

  // 用户登录信息
  const userLoginInfoRes = await cloud.callFunction({
    name: 'getUserInfo',
    data: {
      openId
    }
  });

  const { result } = userLoginInfoRes || {}
  const { userInfo } = result || {}

  if (!userInfo || Object.keys(userInfo).length === 0) {
    return {
      commentInfo: null
    }
  }

  const { avatarUrl, nickName } = userInfo || {};

  const data = {
    cnt,
    date: new Date(),
    avatarUrl,
    nickName,
    replyTo,
    openId,
    _id: `${openId}_${+new Date()}`,
  }

  // 写入回复评论
  const res = await commentDB.doc(id).update({
    data: {
      replies: _.push([data])
    }
  }).catch(() => null);

  if (!res) {
    return {
      commentInfo: null,
    }
  }


  // 寫進用戶回復表
  const { commentOpenId, cnt: replyCommentInfoCnt, postId } = replyCommentInfo || {};
  const { openId: replyItemOpenId } = replyItem || {}

  // 评论文章标题
  const postRes = await post.doc(postId).field({
    title: true
  }).get();

  const replyUserRes = await userReplyDB.add({
    data: {
      openId: replyItemOpenId || commentOpenId,
      commentId: id,
      cnt: replyCommentInfoCnt,
      date: new Date(),
      postId,
      postTitle: postRes.data.title || '',
      replier: {
        openId,
        avatarUrl,
        nickName,
        cnt
      },
      replyToReply: replyItem
    }
  }).catch(() => null);

  return {
    commentInfo: {
      _id: `${openId}_${+new Date()}`, // 兼容之前没ID的数据
      ...data,
    }
  }
}