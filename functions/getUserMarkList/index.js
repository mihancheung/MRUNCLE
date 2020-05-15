const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const marks = db.collection('marks');
const post = db.collection('post');

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
    const res = await marks.where({
      openId
    })
    .field({
      postId: true
    })
    .get()
    .catch(() => null);

    if (!res || !res.data) {
      return [];
    };

    const postIds = res.data.map((item) => {
      return item.postId;
    });

    return postIds;
  }

  const markPostIds = await getMarkPostIds();
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