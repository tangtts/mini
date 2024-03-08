// pages/list/list.js
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';
const _ = db.command;
const $ = db.command.aggregate;
/**
 * 表示数据可查看的范围
 * @enum {0 | 1 | 2}
 * @readonly
 */
const DATA_TYPE = {
  /**
   * 表示数据可全部查看
   */
  ALL: 0,
  /**
   * 表示数据为私有，仅特定用户可查看
   */
  PRIVATE: 1,
  /**
   * 表示数据为公开，所有用户均可查看
   */
  PUBLIC: 2
}

/**
 * 表示排序的范围
 * @enum {0 | 1 | 2 | 3 }
 * @readonly
 */
const SORT_TYPE = {
  /**
   * 表示默认排序
   */
  DEFAULT: 0,
  /**
   * 距离排序
   */
  DISTANCE: 1,
  /**
   * 好评排序
   */
  RATE: 2,

  /**
   * 收藏量排序 
   */
  COLLECTION_COUNT: 3
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    restaurantName: "",
    list: [],
    pageNum: 1,
    pageSize: 5,
    listTotal: 0,
    loading: true,

    sortOption: [{
        text: '默认排序',
        value: 0
      },
      {
        text: '距离优先',
        value: 1
      },
      {
        text: '好评优先',
        value: 2
      },
      {
        text: '收藏量优先',
        value: 3
      },
    ],

    dataOption: [{
        text: '全部',
        value: 0
      },
      {
        text: '私有',
        value: 1
      }, {
        text: '公开',
        value: 2
      }
    ],
    sortDropdownValue: SORT_TYPE.DEFAULT,
    dataDropdownValue: DATA_TYPE.ALL
  },

  changeSortDropdown({
    detail
  }) {
    this.setData({
      sortDropdownValue: detail
    })
    this.fetchList()
  },
  changeDataDropdown({
    detail
  }) {
    this.setData({
      dataDropdownValue: detail
    })
    this.fetchList()
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

  // 是否已经收藏过
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
      };
      this.successCollect(openId, recordId)
    })
  },

  // 更新收藏数量 + 添加到collect
  successCollect(openId, recordId) {
    //收藏量 + 1
    db.collection("records").doc(recordId).update({
      data: {
        collectCount: _.inc(1)
      }
    })
    db.collection('collections').add({
      data: {
        openId,
        recordId,
        collectTime: new Date
      }
    }).then(res => {
      Toast.success('收藏成功~')
    })
  },

  clickCell(e) {
    // 判断是否登录
    this.checkOpenId().then(res => {
      let id = e.currentTarget.dataset.id;
      let url = `../detail/detail`;
      if (id) {
        url += `?id=${id}`;
      }
      wx.navigateTo({
        url: url,
      })
    })
  },


   fetchList({
    restaurantName
  } = {
    restaurantName: ""
  }) {
    this.setData({
      loading: true
    });

    wx.cloud.callFunction({
      name: "quickstartFunctions",
      data: {
        type: "mergePublicData",
        pageNum: this.data.pageNum,
        restaurantName,
        dataType: this.data.dataDropdownValue, // 全部 = 0 ，私有 = 1，公开 = 2,
        sortType: this.data.sortDropdownValue
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

  goToLocation(e) {
    const detail = e.currentTarget.dataset.item;
    wx.openLocation({
      longitude: detail.loc.coordinates[0],
      latitude: detail.loc.coordinates[1],
      name: detail.restaurantName,
      address: detail.restaurantAddress
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

  onChangeRestaurantName(e) {
    this.setData({
      restaurantName: e.detail,
    });
  },

  onSearchRestaurantName() {
    this.fetchList({
      restaurantName: this.data.restaurantName
    })
  },
})