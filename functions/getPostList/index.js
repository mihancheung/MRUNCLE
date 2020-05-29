const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const postDB = db.collection('post');
const roleDB = db.collection('role');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const {
    matchTag,
    orderBy = {
      key: 'date',
      type: 'desc'
    },
    skip = 0,
    limit = 10,
    field = {
      date: false,
      mdFileId: false,
    },
    total,
    role,
  } = event;

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

  // 查询列表总长度
  let nextTotal = total
  const totalRes = !nextTotal ? (await postDB.where({
    tags: matchTag ? _.all([matchTag]) : _.exists(true),
    isHide: _.neq(true),
    ...qsRole
  }).count().catch(() => null)) : null;
  
  if (totalRes) {
    nextTotal = totalRes.total;
  }

  // 分页查询
  const res = await postDB
    .where({
      tags: matchTag ? _.all([matchTag]) : _.exists(true),
      isHide: _.neq(true),
      ...qsRole
    })
    .orderBy(orderBy.key, orderBy.type)
    .skip(skip)
    .limit(limit)
    .field({
      ...field
    })
    .get().catch(() => null);

  if (!res || !res.data) {
    return {
      code: 500,
    }
  }

  return {
    code: 0,
    data: res.data,
    total: nextTotal,
    role: nextRole
  }
}