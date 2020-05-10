import { formatePostData } from '../../../../utils/index';

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
    list: [],
  },

  lifetimes: {
    attached: function () {
      this._init();
    }
  },

  pageLifetimes:  {
    show () {
      if (app.markTotal !== this.total) {
        this._resetData();
      }
    }
  },

  methods: {
    onTapArticle (e) {
      const { dataset } = e.currentTarget
      const { id } = dataset || {};

      if (!id) return;

      wx.navigateTo({
        url: `/pages/post/post?id=${id}`
      });
    },

    onReachBottom () {
      if (this._isGettingData || this.data.list.length * MAX_MARK_LIST >= this.total) return;
      this._getData();
    },

    _init () {
      app.markTotal = null;
      this._getData();
    },

    _resetData () {
      app.markTotal = null;
      this.total = null;
      this.setData({
        isLoading: true,
        isError: false,
        isShowEmpty: false,
        list: [],
      }, () => {
        this._getData();
      });
    },

    _setListEmpty () {
      this.setData({
        isShowEmpty: true,
        isLoading: false
      });
    },

    async _getData () {
      if (!app.isConnected) {
        app.showNoNetworkToast();
        return;
      }

      this._isGettingData = true
      const res = await wx.cloud.callFunction({
        name: 'getUserMarkList',
        data: {
          maxMarksLength: MAX_MARK_LIST,
          skip: this.data.list.length * MAX_MARK_LIST,
        }
      }).catch(() => null);

      this._isGettingData = false

      const { result } = res || {};
      const { userMarkList, total } = result || {}

      this.total = typeof this.total !== 'number' ? total : this.total;

      // 初始化全局mark總數
      if (typeof app.markTotal !== 'number') {
        app.markTotal = total
      }

      if (this.total === 0) {
        this._setListEmpty();
        return;
      }

      if (!userMarkList || userMarkList.length === 0) {
        return;
      }


      const nextList = userMarkList.map((item) => {
        const formatItem = formatePostData(item);
        delete formatItem.author;
        delete formatItem.avata;
        delete formatItem.mdFileId;

        return formatItem;
      });

      const nextListLengt = this.data.list.length * MAX_MARK_LIST + MAX_MARK_LIST

      this.setData({
        [`list[${this.data.list.length}]`]: nextList,
        isLoading: nextListLengt < this.total
      });
    }
  }
});