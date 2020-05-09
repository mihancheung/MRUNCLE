import { formatePostData } from '../../../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');
const user = db.collection('user');
const _ = db.command;
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
      this._getData();
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

    _setListEmpty () {
      this.setData({
        isShowEmpty: true,
        isLoading: false
      });
    },

    async getPostLength () {
      const res = await post.count();
      if (!res || typeof res.total !== 'number') return;
      this.postTotal = res.total
    },

    async _getData () {
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

      this.setData({
        [`list[${this.data.list.length}]`]: nextList
      }, () => {
        if (this.data.list.length * MAX_MARK_LIST >= this.total) {
          this.setData({
            isLoading: false
          });
        }
      });
    }
  }
});