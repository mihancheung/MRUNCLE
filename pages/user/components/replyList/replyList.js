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

      if (isDelete.cancel) {
        this._hideDelete(index);
        return;
      };

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
      const { detail, currentTarget } = e;
      const { index } = currentTarget.dataset;

      if (detail.source === 'touch') {
        this.startX = !this.startX ? detail.x : this.startX;
        this.endX = detail.x;
        this.distX = detail.x;
        this.source = 'touch';
      } else if (detail.source === 'friction') {
        if (this.endX > this.startX) {
          this._hideDelete(index);
        } else {
          this._showDelete(index);
        }
      }
    },

    onTouchEnd (e) {
      const { index } = e.currentTarget.dataset;
      this.index = index;

      if (typeof this.distX !== 'number') return;

      const btnShowWidth = this.btnWidth / 2;

      if (Math.abs(this.distX) > btnShowWidth) {
        this._showDelete(index);
      } else {
        this._hideDelete(index);
      }
    },

    onTouchStart (e) {
      const { index } = e.currentTarget.dataset;
      const preItem = this.index && this.data.list[this.index[0]][this.index[1]];

      this.distX = null;
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

    _setDeleteBtnWidth () {
      let pixelRatio = 1;

      try {
        const res = wx.getSystemInfoSync()
        pixelRatio = res.screenWidth / 750;
      } catch (e) {
        pixelRatio = 1;
      }

      this.btnWidth = 150 * pixelRatio;
    },

    _showDelete (index) {
      const thisItem = `list[${index[0]}][${index[1]}]`;
      this.setData({
        [`${thisItem}.x`]: this.btnWidth * -1
      }, () => {
        this.distX = 0;
        this.startX = 0;
        this.endX = 0;
      });
    },

    _hideDelete (index) {
      const thisItem = `list[${index[0]}][${index[1]}]`;
      this.setData({
        [`${thisItem}.x`]: 0
      }, () => {
        this.distX = 0;
        this.startX = 0;
        this.endX = 0;
      });
    },

    _init () {
      this.dynamicCommentTotal = 0;
      this._setDeleteBtnWidth();
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