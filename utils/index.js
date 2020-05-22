import { config } from '../utils/config';

export function formatDate(date) {
  if (!date) return date

  const nextDate = new Date(date)
  let o = {
    Y: nextDate.getFullYear(),
    M: nextDate.getMonth() + 1,
    D: nextDate.getDate(),
    h: nextDate.getHours(),
    m: nextDate.getMinutes(),
    s: nextDate.getSeconds()
  }
  for (let k in o) {
    if (('' + o[k]).length <= 1) {
      o[k] = ('0' + o[k]).substr(-2)
    }
  }
  return `${o.Y}-${o.M}-${o.D} ${o.h}:${o.m}:${o.s}`
};

export function postDate(date) {
  if (!date) return date

  const nowTime = +new Date();
  const serviceTime = +new Date(date);

  const dist = Math.abs(nowTime - serviceTime);
  const s = 1000;
  const m = s * 60;
  const h = m * 60;
  const d = h * 24;
  let txt = ''

  if (dist < m) {
    txt = '刚刚'
  } else if (dist >= m && dist < h) {
    txt = `${parseInt(dist / m)}分钟前`
  } else if (dist >= h && dist < d) {
    txt = `${parseInt(dist / h)}小时前`
  } else if (new Date().getDate() - new Date(date).getDate() === 1) {
    txt = '昨日'
  } else {
    txt = formatDate(date);
  }

  return txt;
};

export function formatePostData (data = {}) {
  const {
    date: dataDate,
    avata: dataAvata,
    author: dataAuthor,
    mdFileId: dataMdFileId,
    poster: dataPoster
  } = data || {};
  const avata = dataAvata || config.postAvata;
  const author = dataAuthor || config.postAuthor;
  const date = formatDate(+new Date(dataDate));
  const mdFileId = `${config.cdnBase}${dataMdFileId}`;
  const poster = `${config.cdnBase}${dataPoster}`;

  return {
    ...data,
    avata,
    author,
    date,
    mdFileId,
    poster
  }
};

export function showNoNetworkToast () {
  wx.showToast({
    title: '大禍，你嘅網絡 off 咗',
    icon: 'none',
    duration: 2500
  });
};