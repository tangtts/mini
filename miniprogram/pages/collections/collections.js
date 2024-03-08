// pages/collections/collections.js
const db = wx.cloud.database();
const _ = db.command;
import Dialog from '@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    pageSize: 5,
    pageNum: 1
  },
  clickCell(e) {
    wx.navigateTo({
      url: `../detail/detail?id=${e.currentTarget.dataset.id}`,
    })
  },

  unCollect(e) {
    const item = e.currentTarget.dataset.item;
    Dialog.confirm({
      message: '是否要取消收藏当前内容？',
    }).then(async () => {

      let collectData = await db.collection('collections').where({
        recordId: item._id
      }).get();


      const collects = collectData.data;
      const collect = collects[0];
      if (!collect) return;
      let r = await db.collection('collections').doc(collect._id).remove();
      if (r.stats.removed === 1) {

        // 把当前 record 的收藏数 -1；
        db.collection("records").where({
          _id: item._id
        }).update({
          data: {
            collectCount: _.inc(-1)
          },
          success: () => {
            wx.showToast({
              title: '操作成功',
              icon: "success",
              success: this.fetchList
            })
          }
        });
      }
    })
  },

  fetchList() {
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "selectCollection",
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        this.setData({
          list: res.result
        })
      },
    })
  },

  async onShow() {
    this.fetchList()
  },

  onPullDownRefresh() {
    this.setData({
      pageSize: 1
    })
    this.fetchList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.setData({
      pageNum: this.data.pageNum + 1
    })
    this.fetchList()
  }
})