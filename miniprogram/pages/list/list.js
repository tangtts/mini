// pages/list/list.js
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';
const app = getApp()
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
        latitude: app.globalData.loc.latitude,
        longitude: app.globalData.loc.longitude,
        list: [],
        pageNum: 1,
        pageSize: 5,
        listTotal: 0,

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




    async getData({
         openId,
        ...other
    }) {

        const that  = this;


      function  getDistance({ lat1, lng1, lat2, lng2 }) {
            var radLat1 = lat1 * Math.PI / 180.0;
            var radLat2 = lat2 * Math.PI / 180.0;
            var a = radLat1 - radLat2;
            var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
            var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
                Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
            s = s * 6378.137;// EARTH_RADIUS;
            s = Math.round(s * 10000) / 10000;
            return s;
        }

        function sort(data, sortType) {
            switch (sortType) {
                case SORT_TYPE.DISTANCE:
                    return data.sort((a, b) => {
                        return getDistance({ lat1: a.loc.latitude, lng1: a.loc.longitude, lat2: 0, lng2: 0 }) - getDistance({ lat1: b.loc.latitude, lng1: b.loc.longitude, lat2: 0, lng2: 0 })
                    }
                    )
                case SORT_TYPE.RATE:
                    return data.sort((a, b) => b.rate - a.rate);
                case SORT_TYPE.COLLECTION_COUNT:
                    return rawData.sort((a, b) => b.collectCount - a.collectCount)
                default:
                    return data;
            }
        }

        try {

            if (!other.pageSize) {
                other.pageSize = 10;
            }

            if (!other.pageNum) {
                other.pageNum = 1;
            }

            let conditions = {}



            // 查询公共记录
            const res = await db.collection("records").where({
                isPublic: true,
                ...conditions
            }).get();

            let publicRecords = sort(res.data, other.sortType);

            if (!openId) {
                return publicRecords;
            }

            if (other.dataType == DATA_TYPE.ALL) {

                const res = await db.collection("records").where({
                    openId,
                    // 去除自己已经公开的
                    isPublic: _.neq(true),
                    ...conditions
                }).get();

                console.log(res)
                let rawData = publicRecords.concat(res.data)
                let x = sort(rawData, other.sortType)
                console.log(x)
            } else if (other.dataType == DATA_TYPE.PRIVATE) {
                // 私人
                const res = await db.collection("records").where({
                    openId,
                    // 模糊查询
                    ...conditions
                }).get();
                return sort(res.data, other.sortType)
            } else {
                return sort(publicRecords, other.sortType)
            }
        } catch (err) {
            throw err;
        }
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
        wx.showLoading({
            title: '正在加载中...',
        })


        wx.cloud.callFunction({
            name: "quickstartFunctions",
            data: {
                type: "mergePublicData",
                pageNum: this.data.pageNum,
                restaurantName,
                dataType: this.data.dataDropdownValue, // 全部 = 0 ，私有 = 1，公开 = 2,
                sortType: this.data.sortDropdownValue,
                latitude: this.data.latitude,
                longitude: this.data.longitude,
            },
            success: (res) => {
                const result = res.result;
                this.addDistanceToList(result);
            },
            fail: (err) => {
                console.log(err, "er")
            },
            complete: () => {
                wx.stopPullDownRefresh()
                wx.hideLoading()
            }
        })
    },
  
    addDistanceToList(list) {
        Promise.all(list.map(item =>
            wx.cloud.callFunction({
                name: "quickstartFunctions",
                data: {
                    type: "getDistance",
                    lat1: this.data.latitude,
                    lng1: this.data.longitude,
                    lat2: item.loc.coordinates[1],
                    lng2: item.loc.coordinates[0],
                },
            })
        )).then(distances => {
            const updatedList = list.map((item, index) => {
                return {
                    distance: distances[index].result.toFixed(2),
                    ...item,
                };
            });

            this.setData({
                list: updatedList,
            });
        }).catch(error => {
            // 处理错误
            console.error("Error fetching distances:", error);
        });
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