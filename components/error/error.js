Component({
  properties: {
    isError: {
      type: Boolean,
      value: true,
    },

    title: {
      type: String,
      value: '獲取數據出現問題',
    },

    desc: {
      type: String,
      value: '數據已著草，可使用按鈕嘗試重新獲取',
    },
  },

  data: {
    networkErrorText: ''
  },

  lifetimes: {
    attached: function () {
      const app = getApp();
      this.setData({
        networkErrorText: app.isConnected ? '' : '網絡似乎飛走咗，請重新連接後F5'
      })
    }
  },

  methods: {
    onErrorReload: function () {
      this.triggerEvent('tapReload');
    }
  }
});