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
  const {
    maxMarksLength = 10,
    orderBy = {
      key: 'date',
      type: 'desc'
    },
    field = {
      title: true,
      poster: true,
      date: true,
    },
    skip = 0,
  } = event;

  const getMarkPostIds = async () => {
    const userRes = await user.where({
      openId
    })
    .field({
      likePosts: false,
      openId: false
    })
    .get()
    .catch(() => null);

    if (!userRes || !userRes.data || !userRes.data[0] ) {
      return []
    };

    return userRes.data[0].markPosts || [];
  }

  const markPostIds = await getMarkPostIds();
  console.log('markPostIds', markPostIds)
  const userMarkListRes = await post
    .where({
      _id: _.in(markPostIds)
    })
    .field(field)
    .orderBy(orderBy.key, orderBy.type)
    .skip(skip)
    .limit(maxMarksLength)
    .get()
    .catch(() => null);

  if (!userMarkListRes || !userMarkListRes.data || userMarkListRes.data.length === 0) {
    return {
      userMarkList: [],
      total: 0,
    }
  }

  return {
    userMarkList: userMarkListRes.data,
    total: markPostIds.length,
  }
}