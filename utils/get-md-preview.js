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
}