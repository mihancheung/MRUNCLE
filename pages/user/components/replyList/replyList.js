import { postDate,  showNoNetworkToast } from '../../../../utils/index';

const app = getApp();
const MAX_MARK_LIST = 10;

Component({
  properties: {
    markPage: {
      type: Number,
      value: 0,
    },
  },

  data: {
    isLoading: true,
    isError: false,
    isShowEmpty: false,
    list: []
  },

  lifetimes: {
    attached: function () {
      this._init();
    }
  },

  pageLifetimes:  {
    show () {

    }
  },

  methods: {
    onTapArticle (e) {
      const { dataset } = e.currentTarget
      const { postId } = dataset || {};

      if (!postId) return;

      wx.navigateTo({
        url: `/article/pages/post/post?id=${postId}`
      });
    },

    onTapReply (e) {
      const { dataset } = e.currentTarget;
      const { commentId } = dataset || {};

      if (!commentId) return;

      wx.navigateTo({
        url: `/article/pages/detail/detail?id=${commentId}`
      });
    },

    async onDelete (e) {
      const { id, index } = e.currentTarget.dataset;
      if (this.deleting) return;

      const isDelete = await wx.showModal({
        title: '删除后将不能恢复，是否继续？'
      });

      if (isDelete.cancel) return;

      wx.showLoading({
        title: '正在删除'
      });

      this.deleting = true;
      const res = await wx.cloud.callFunction({
        name: 'deleteMsg',
        data: {
          id
        }
      }).catch(() => null);
      this.deleting = false;
      wx.hideLoading();

      const { result } = res || {};
      const { total, res: resultRes } = result || {};

      if (!resultRes) {
        wx.showToast({
          title: '未能成功删除',
          icon: 'none'
        });
        return
      };
      
      this.dynamicCommentTotal -= 1;
  
      this.setData({
        [`list[${index[0]}][${index[1]}]`]: null
      }, () => {
        if (total === 0) {
          this._setListEmpty();
        }
      });
  
      wx.showToast({
        title: '删除成功',
        icon: 'none'
      });
    },

    onTouchMoveBox (e) {
      const { index = [] } = e.currentTarget.dataset
      const { type, detail, changedTouches = [] } = e
      const thisItem = `list[${index[0]}][${index[1]}]`;
      let pixelRatio = 1;

      try {
        const res = wx.getSystemInfoSync()
        pixelRatio = res.screenWidth / 750;
      } catch (e) {
        pixelRatio = 1;
      }
      // this.endX = changedTouches[0] && changedTouches[0].pageX;
      const distX = this.endX - this.startX
      const btnWidth = 150 * pixelRatio;
      const btnShowWidth = btnWidth / 2;

      if (detail.source === 'friction') {

        if (this.endX - this.startX > 0) {
          this.setData({
            [`${thisItem}.x`]: 0
          });
        } else {
          this.setData({
            [`${thisItem}.x`]: btnWidth * -1
          })
        }

        // if (detail.x >= -20) {
        //   this.setData({
        //     [`${thisItem}.x`]: 0
        //   })
        // } else {
        //   this.setData({
        //     [`${thisItem}.x`]: btnWidth * -1
        //   })
        // }

      } 
      // else if (detail.x === 0 && detail.source === 'out-of-bounds') {
      //   this.setData({
      //     [`${thisItem}.x`]: 0
      //   })
      // }

    },

    onTouchEnd (e) {
      const { index } = e.currentTarget.dataset
      this.endX = e.changedTouches[0].pageX;
      this.endY = e.changedTouches[0].pageY;
      this.endTimeStamp = e.timeStamp;
      const thisItem = `list[${index[0]}][${index[1]}]`;
      this.index = index;

      let pixelRatio = 1;

      try {
        const res = wx.getSystemInfoSync()
        pixelRatio = res.screenWidth / 750;
      } catch (e) {
        pixelRatio = 1;
      }

      const stamp = this.endTimeStamp - this.startTimeStamp;
      const distX = this.endX - this.startX
      const btnWidth = 150 * pixelRatio;
      const btnShowWidth = btnWidth / 2;
      const distY = this.endY - this.startY;
      const tan = Math.abs(distY / distX);

      // if (distX > btnShowWidth) {
      //   this.setData({
      //     [`${thisItem}.x`]: 0
      //   });
      // } else {
      //   this.setData({
      //     [`${thisItem}.x`]: btnWidth * -1
      //   })
      // }

      // if (stamp < 200 && tan > 0.364 && distX < 0) {
      //   return;
      // }


      // if (stamp < 700) {
      //   if (distX < 0) {
      //     this.setData({
      //       [`${thisItem}.x`]: btnWidth * -1
      //     });
      //   } else {
      //     this.setData({
      //       [`${thisItem}.x`]: 0
      //     });
      //   }
      // }

      if (stamp >= 500) {

        if (distX > 0) {
          if (distX > btnShowWidth) {
            this.setData({
              [`${thisItem}.x`]: 0
            });
          } else {
            this.setData({
              [`${thisItem}.x`]: btnWidth * -1
            });
          }
        }

        if (distX < 0) {
          if (Math.abs(distX) > btnShowWidth) {
            this.setData({
              [`${thisItem}.x`]: btnWidth * -1
            });
          } else {
            this.setData({
              [`${thisItem}.x`]: 0
            });
          }
        } else {
          if ( distX < 0) {
            this.setData({
              [`${thisItem}.x`]: btnWidth * -1
            });
          } else {
            this.setData({
              [`${thisItem}.x`]: 0
            });
          }
        }

        // if (Math.abs(distX) > btnShowWidth) {
        //   this.setData({
        //     [`${thisItem}.x`]: btnWidth * -1
        //   });
        // } else {
        //   this.setData({
        //     [`${thisItem}.x`]: 0
        //   });
        // }
      }

      // if (Math.abs(distX) > btnShowWidth) {
      //   this.setData({
      //     [`${thisItem}.x`]: btnWidth * -1
      //   });
      // } else {
      //   this.setData({
      //     [`${thisItem}.x`]: 0
      //   });
      // }
    },

    onTouchStart (e) {
      const { index } = e.currentTarget.dataset;
      this.startX = e.changedTouches[0].pageX;
      this.startY = e.changedTouches[0].pageY;
      this.startTimeStamp = e.timeStamp;
      const preItem = this.index && this.data.list[this.index[0]][this.index[1]];

      if (preItem && JSON.stringify(this.index) !== JSON.stringify(index)) {
        this.setData({
          [`list[${this.index[0]}][${this.index[1]}].x`]: 0,
        });
      }
    },

    onReachBottom () {
      if (this._isGettingData || this.data.list.length * MAX_MARK_LIST >= this.initTotal) return;
      this._getData();
    },

    _init () {
      this.dynamicCommentTotal = 0;
      this._getData();
    },

    _setListEmpty () {
      this.setData({
        isShowEmpty: true,
        isLoading: false
      });
    },

    async _getData () {
      if (!app.isConnected) {
        showNoNetworkToast();
        return;
      }

      this._isGettingData = true
      const res = await wx.cloud.callFunction({
        name: 'getReplyMsg',
        data: {
          maxMarksLength: MAX_MARK_LIST,
          skip: this.data.list.length * MAX_MARK_LIST + this.dynamicCommentTotal,
        }
      }).catch(() => null);

      this._isGettingData = false

      const { result } = res || {};
      const { msgList, total } = result || {}

      this.initTotal = typeof this.initTotal !== 'number' ? total : this.initTotal;

      if (total === 0) {
        this._setListEmpty();
        return;
      }

      if (!msgList || msgList.length === 0) {
        return;
      }

      const nextList = msgList.map((item) => {
        const { date } = item || {};
        const formateDate = postDate(date);
        item.date = formateDate;
        item.x = 0;
        return item;
      });

      const nextListLength = this.data.list.length * MAX_MARK_LIST + MAX_MARK_LIST

      this.setData({
        [`list[${this.data.list.length}]`]: nextList,
        isLoading: nextListLength < this.initTotal
      });
    }
  }
});