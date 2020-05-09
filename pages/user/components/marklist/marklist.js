import { formatePostData } from '../../../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');
const user = db.collection('user');
const _ = db.command;
const ARTICLE_MAX = 10;

Component({
  properties: {
    openId: {
      type: String,
      value: '',
    },

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

    async getPostLength () {
      const res = await post.count();
      if (!res || typeof res.total !== 'number') return;
      this.postTotal = res.total
    },

    async _getData () {
      const openId = this.properties.openId
      if (!openId) return;
      const userRes = await user.where({
        openId: openId
      })
      .get()
      .catch(() => null);

      if (!userRes || !userRes.data || !userRes.data[0] ) return;

      const markPostIds = userRes.data[0].markPosts;
      this.marksLength = markPostIds.length;
      
      if (this.marksLength === 0) {
        this.setData({
          isShowEmpty: true
        });
        return;
      };

      const postRes = await post
        .where({
          _id: _.in(markPostIds)
        })
        .field({
          tags: false,
          mdFileId: false,
        })
        .orderBy('date', 'desc')
        .limit(10)
        .get()
        .catch(() => null);

      if (!postRes || !postRes.data || postRes.data.length === 0) return;

      const nextList = postRes.data.map((item) => {
        const formatItem = formatePostData(item);
        delete formatItem.author;
        delete formatItem.avata;
        delete formatItem.mdFileId;

        return formatItem;
      });

      this.setData({
        [`list[${this.data.list.length}]`]: nextList
      });
    }
  }
});