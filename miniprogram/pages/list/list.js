// pages/list/list.js
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    restaurantName: "",
    list: [{}, {}, {}, {}],
    pageNum: 1,
    pageSize: 5,
    listTotal: 0,
    loading: true
  },
  onChange(e) {
    this.setData({
      restaurantName: e.detail,
    });
  },
  onSearch() {
    this.fetchList({
      restaurantName: this.data.restaurantName
    })
  },

  // 判断是否登录
  checkOpenId() {
    let existOpenId = wx.getStorageSync("openId");
    return new Promise((resolve, reject) => {
      if (existOpenId) {
        return resolve(existOpenId)
      } else {
        wx.cloud.callFunction({
          name: "quickstartFunctions",
          data: {
            type: "getOpenId"
          }
        }).then((res) => {
          wx.setStorageSync("openId", res.result.openid)
          resolve(res.result.openid)
        }).catch(reject)
      }
    })
  },

  isCollected(openId, recordId) {
    return db.collection('collections').where({
      openId,
      recordId
    }).get()
  },
  
  async collect(e) {
    // 收藏必须先登录
    const recordId = e.currentTarget.dataset.id
    this.checkOpenId().then(async (openId) => {
      // 是否收藏过
      let r = await this.isCollected(openId, recordId);
      if (r.data.length !== 0) {
        return Toast('已经收藏过了~');
      }
      db.collection('collections').add({
        data: {
          openId,
          recordId,
          collectTime: new Date
        }
      }).then(res => {
        console.log(res)
      })
    })

  },

  clickCell(e) {
    // 判断是否登录
    this.checkOpenId().then(res => {
      wx.navigateTo({
        url: `../detail/detail?id=${e.currentTarget.dataset.id}`,
      })
    })
  },

  fetchList({
    restaurantName
  } = {
    restaurantName: ""
  }) {
    let openId = wx.getStorageSync("openId");
    this.setData({
      loading: true
    })
    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "mergePublicData",
        openId,
        pageNum: this.data.pageNum,
        restaurantName
      },
      success: (res) => {
        this.setData({
          list: res.result
        })
      },
      fail: (err) => {
        console.log(err, "er")
      },
      complete: () => {
        wx.stopPullDownRefresh()
        this.setData({
          loading: false
        })
      }
    })
  },

  async onShow() {
    const listTotal = await db.collection('records').count();
    this.setData({
      listTotal
    })
    this.fetchList()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      pageSize: 1
    })
    this.fetchList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.listTotal <= this.data.pageSize * this.data.pageNum) {
      return wx.showToast({
        title: '暂无更多',
        icon: "none"
      })
    }
    this.setData({
      pageSize: this.data.pageSize + 1
    })
    this.fetchList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})