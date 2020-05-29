const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const roleDB = db.collection('role');

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;

  const res = await roleDB.where({
    openId
  })
  .get()
  .catch(() => null);

  if (!res || !res.data || !res.data[0]) return;

  return {
    role: res.data[0].role
  }
}