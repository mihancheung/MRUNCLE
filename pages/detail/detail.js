Page({
  data: {
    id: '',
  },

  onLoad (option) {
    const { id } = option;
    this.setData({
      id
    });
  },

  onReachBottom () {
    const comments = this.selectComponent('#comments') || {};
    typeof comments.onReachBottom === 'function' && comments.onReachBottom();
  },

  onPullDownRefresh () {
    wx.stopPullDownRefresh();
    const comments = this.selectComponent('#comments') || {};
    typeof comments.onPullDownRefresh === 'function' && comments.onPullDownRefresh();
  },

  onGetReplyTotal (e) {
    const { total } = e.detail
    if (this.total === total) return;
    
    this.total = total;
    this.setData({
      total
    });
  }
})
