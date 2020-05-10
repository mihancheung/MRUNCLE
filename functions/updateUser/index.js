const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const user = db.collection('user');
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID: openId } = wxContext;
  const { type = 'add', postIds, key } = event;

  // 查詢是否存用戶記錄是否存在
  const isExistRes = await user.where({
    openId
  }).get().catch(() => null);

  const add = (addArr) => {
    return _.addToSet({
      $each: addArr
    });
  }

  const cancel = (cancelArr) => {
    return _.pull(_.in(cancelArr))
  }

  let updateReq = null;

  // 無數據需新插入
  if (isExistRes.data.length === 0) {
    updateReq = user.add({
      data: {
        [key]: postIds,
        openId,
      }
    });
  } else {
    updateReq = user.where({
      openId
    }).update({
      data: {
        [key]: type === 'cancel' ? cancel(postIds) : add(postIds),
        openId,
      }
    });
  }

  let res = await updateReq.catch(() => null);

  // 更新異常，不返回更新數據
  if (!res) {
    return {
      res: null
    }
  }

  // 查詢當前總數異常，不返回總數
  if (!isExistRes) {
    return {
      res
    }
  }

  return {
    res,
  };
}