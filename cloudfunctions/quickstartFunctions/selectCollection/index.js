const cloud = require('wx-server-sdk');

const getOpenId = require("../getOpenId");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

async function getData({
  openid:openId,
  pageSize,
  pageNum
}) {
  try {
    const collections = await db.collection('collections').where({
      openId
    }).get();

    const recordIds = collections.data.map(collection => collection.recordId);

    const records = await db.collection('records').where({
      _id: db.command.in(recordIds)
    }).skip((pageNum - 1) * pageSize).limit(pageSize).get();

    return records.data;
  } catch (error) {
    throw error;
  }
}

// 查询数据库集合云函数入口函数
exports.main = async (event, context) => {
  try {
    const data = await getOpenId.main(event, context);
    return await getData({
      ...event,
      ...data
    });
  } catch (error) {
    return error
  }
};