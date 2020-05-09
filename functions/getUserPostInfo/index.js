const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const user = db.collection('user');
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
      tags: false,
      mdFileId: false,
    },
    skip = 0,
    total,
  } = event

  const getMarkPostIds = async () => {
    const userRes = await user.where({
      openId: openId
    })
    .get()
    .catch(() => null);

    if (!userRes || !userRes.data || !userRes.data[0] ) {
      return []
    };

    return userRes.data[0].markPosts || [];
  }

  const markPostIds = total || (await getMarkPostIds());

  const userPostInfoRes = await post
    .where({
      _id: _.in(markPostIds)
    })
    .field(field)
    .orderBy(orderBy.key, orderBy.type)
    .skip(skip)
    .limit(maxMarksLength)
    .get()
    .catch(() => null);

  if (!userPostInfoRes || !userPostInfoRes.data || userPostInfoRes.data.length === 0) {
    return {
      userPostInfo: [],
      markPostTotal: markPostIds.length,
    }
  }

  return {
    userPostInfo: userPostInfoRes.data,
    markPostTotal: markPostIds.length,
  }
}