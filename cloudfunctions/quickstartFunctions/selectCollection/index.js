const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate



async function getData(openId) {
  openId = openId || "or7475NcTA0SDRbQq9du1s6ixjJQ";

  try {
    const collections = await db.collection('collections').where({
      openId
    }).get();

    const recordIds = collections.data.map(collection => collection.recordId);

    const records = await db.collection('records').where({
      _id: db.command.in(recordIds),
      openId
    }).get();

    return records.data;
  } catch (error) {
    throw error;
  }
}


function getData2({
  openId,
  pageSize,
  pageNum
}) {
  return new Promise((resolve, reject) => {
    // collections 中的 openId 与传进来的 openId 相同
    // 从上一步找到对应的 元素中找到 recordId
    // 从 records 找到 recordId
    db.collection('collections').aggregate().match({
        openId
      }).lookup({
        from: "records",
        localField: "recordId",
        foreignField: "_id",
        as: "collect"
      })
      .addFields({
        "collect.collectTime": "$collectTime", // 将 collections 中的 collectTime 字段添加到 collect 中
        "collect.collectId": "$_id"
      }).replaceRoot({
        newRoot: {
          $arrayElemAt: ["$collect", 0]
        }
      }).project({
        collectId: 1,
        restaurantAddress: 1,
        rate: 1,
        restaurantName: 1,
        _id: 1
      }).limit(pageSize).skip((pageNum - 1) * pageSize)
      .end()
      .then((res) => {
        resolve(res.list)
      }, reject);
  })
}



// 查询数据库集合云函数入口函数
exports.main = async (event, context) => {
  try {
    return await getData2(event)
  } catch (error) {
    return error
  }
};