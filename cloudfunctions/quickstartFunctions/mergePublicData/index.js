const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const $ = db.command.aggregate;

async function getData({
  openId,
  ...other
}) {
  try {
    
    if (!other.pageSize) {
      other.pageSize = 5;
    }
    
    if (!other.pageNum) {
      other.pageNum = 1;
    }

    let conditions = {}

    if(other.restaurantName &&  other.restaurantName.trim() != ''){
      conditions.restaurantName =  new db.RegExp({
        regexp: other.restaurantName,
        options: 'i',
      })
    }

    // 查询公共记录
    const publicRes = await db.collection("records").where({
      isPublic: true,
      ...conditions
    }).orderBy('updateTime', 'asc').get();
    // 应该可以按照时间 距离进行更新
    let allRecords = publicRes.data;

    // 如果存在 openId，再查询私有记录并合并结果
    if (openId) {
      // 有 openId 必须要有 pageNum
      const privateRes = await db.collection("records").where({
          openId,
          // 去除自己已经公开的
          isPublic:$.neq(true),
          // 模糊查询
          ...conditions
        }).orderBy('updateTime', 'asc')
        .limit(other.pageSize)
        .skip((other.pageNum -1) * other.pageSize)
        .get();
      allRecords = allRecords.concat(privateRes.data);
    }

    return allRecords;
  } catch (err) {
    throw err;
  }
}
// 聚合记录云函数入口函数
exports.main = async (event, context) => {
  try {
    return await getData(event);
  } catch (err) {
    return err;
  }
};