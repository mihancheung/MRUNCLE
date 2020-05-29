const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;
const post = db.collection('post');
const roleDB = db.collection('role');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { role } = event;

  let nextRole = role;
  const roleRes = typeof nextRole !== 'string' ? await roleDB.where({
    openId
  })
  .get()
  .catch(() => null) : null;

  if (roleRes && roleRes.data && roleRes.data[0]) {
    nextRole = roleRes.data[0].role;
  }

  const qsRole = nextRole === 'admin' ? {} : {
    role: _.or(_.exists(false), _.all([nextRole]))
  }

  const res = await post.aggregate()
    .match({
      isHide: _.neq(true),
      ...qsRole
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