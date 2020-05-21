const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { fileID } = event;
  if (!fileID) return;

  const res = await cloud.downloadFile({
    fileID,
  }).catch(() => null);

  const { fileContent } = res || {}
  if (!fileContent) return;

  return {
    fileContent: fileContent.toString()
  }
}