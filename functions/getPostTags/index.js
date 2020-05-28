const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;
const post = db.collection('post');

exports.main = async (event, context) => {

  const res = await post.aggregate()
    .match({
      isHide: _.or(_.exists(false), _.eq(false))
    })
    .unwind('$tags')
    .group({
      _id: null,
      tags: $.addToSet('$tags')
    })
    .end()
    .catch(() => null);

  if (!res) {
    return {
      code: '500',
      tags: []
    }
  }

  const { list = [] } = res;
  const { tags = [] } = list[0] || {};

  return {
    code: 0,
    tags
  }
}