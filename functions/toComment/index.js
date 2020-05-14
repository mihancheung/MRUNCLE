const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const commentDB = db.collection('comment');

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext
  const { cnt, postId } = event

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
    openId,
    postId,
  }

  // 拿到最新的
  const totalReq = commentDB.where({
    postId
  }).count();

  // 写入评论
  const res = await commentDB.add({
    data
  }).catch(() => null);


  if (!res) {
    return {
      commentInfo: null,
    }
  }

  // 拿最新的评论总数
  let total = {}
  const totalRes = await totalReq;

  if (totalRes) {
    total = {
      total: totalRes.total
    }
  }

  return {
    commentInfo: data,
    ...total
  }
}