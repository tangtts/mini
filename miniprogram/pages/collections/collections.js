// pages/collections/collections.js
const db = wx.cloud.database();
import Dialog from '@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    pageSize:5,
    pageNum:1
  },
  clickCell(e){
    wx.navigateTo({
      url: `../detail/detail?id=${e.currentTarget.dataset.id}`,
    })
  },

  unCollect(e) {
    Dialog.confirm({
      message: '是否要取消收藏当前内容？',
    }).then(async () => {
      let r = await db.collection('collections').doc(e.currentTarget.dataset.id).remove();
      if (r.stats.removed === 1) {
        wx.showToast({
          title: '操作成功',
          icon: "success",
          success:this.fetchList
        })
      }
    })
  },

  fetchList() {
    console.log("fetchList")
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "selectCollection",
        openId: "or7475NcTA0SDRbQq9du1s6ixjJQ",
        pageNum:this.data.pageNum,
        pageSize:this.data.pageSize
      },
      success: (res) => {
        console.log(res);
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
    this.fetchList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.setData({
      pageNum:this.data.pageNum + 1
    })
    this.fetchList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})