import { formatDate } from '../../utils/index';

const app = getApp();
const db = wx.cloud.database();
const post = db.collection('post');

Page({
  data: {
    info: {},
    md: '',
    isError: false,
    isLoading: true
  },

  onLoad () {
    this.init()
  },

  init () {
    this.getPageInfo()
  },

  mdToWxml (mdFile) {
    if (!mdFile) return;

    const md = app.towxml(mdFile, 'markdown',{
      base: app.cdnEnvBase,
      theme:'light',
    });

    this.setData({
      md
    });
  },

  handleNextData (data) {
    const { date: dataDate, avata: dataAvata, author: dataAuthor } = data;
    const avata = dataAvata || app.postAvata;
    const author = dataAuthor || app.postAuthor;
    const date = formatDate(+new Date(dataDate));

    this.setData({
      info: {
        ...data,
        avata,
        author,
        date,
      }
    });
  },

  async getPageInfo () {
    const postId = '2a625d2b5ea3c6f5001fa82801ea0590';
    const res = await post.doc(postId).get();
    this.setData({
      isLoading: false
    });

    if (!res || !res.data) {
      this.setData({
        isError: true
      });
      return;
    }

    this.handleNextData(res.data);
    this.getPageMdFile(res.data.mdFileId);
  },

  async getPageMdFile (mdFileId) {
    const res = await wx.cloud.getTempFileURL({
      fileList: [mdFileId],
    });

    if (!res || !res.fileList) {
      return;
    }

    const url = res.fileList[0] && res.fileList[0].tempFileURL
    const mdFileRes = await app.wxRequire({
      url
    });

    if (!mdFileRes || !mdFileRes.data) return
    this.mdToWxml(mdFileRes.data);
  }
})
