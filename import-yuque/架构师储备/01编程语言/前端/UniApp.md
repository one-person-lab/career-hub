---
title: "UniApp"
source: https://www.yuque.com/<your-namespace>/yez2nd/nfep6zv8a0iy1hvr
group: "01编程语言 / 前端"
word_count: 128
updated_at: 2025-02-23T06:42:14.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# UniApp

# 页面切换

## 页面跳转

<table data-lake-id="U852J" id="U852J" margin="true" class="lake-table" style="width: 743px"><colgroup><col width="250"><col width="243"><col width="250"></colgroup><tbody><tr data-lake-id="u925fd6f7" id="u925fd6f7"><td data-lake-id="u7158fb37" id="u7158fb37"><p data-lake-id="uc810c05a" id="uc810c05a"><span data-lake-id="ua3818280" id="ua3818280">方法</span></p></td><td data-lake-id="uda92d372" id="uda92d372"><p data-lake-id="u875f9e31" id="u875f9e31"><span data-lake-id="ucc0f00b5" id="ucc0f00b5">适用场景</span></p></td><td data-lake-id="u525cd1f6" id="u525cd1f6"><p data-lake-id="uab02c950" id="uab02c950"><span data-lake-id="u9dca38a2" id="u9dca38a2">是否可返回</span></p></td></tr><tr data-lake-id="u41f84861" id="u41f84861"><td data-lake-id="u3ca079b0" id="u3ca079b0"><p data-lake-id="ud49ea717" id="ud49ea717"><code data-lake-id="uc0b2ddab" id="uc0b2ddab"><span data-lake-id="uf75b95fe" id="uf75b95fe">navigateTo</span></code></p></td><td data-lake-id="ue02b9ced" id="ue02b9ced"><p data-lake-id="u4dc766e1" id="u4dc766e1"><span data-lake-id="u3f1cd048" id="u3f1cd048">普通页面跳转（可返回）</span></p></td><td data-lake-id="u541bb20a" id="u541bb20a"><p data-lake-id="ueebf82fb" id="ueebf82fb"><span data-lake-id="u01728776" id="u01728776">✅</span></p></td></tr><tr data-lake-id="u94dcf0d1" id="u94dcf0d1" style="height: 37px"><td data-lake-id="u362bbc29" id="u362bbc29"><p data-lake-id="uf0926ba4" id="uf0926ba4"><code data-lake-id="u672dbb42" id="u672dbb42"><span data-lake-id="uffbbf0f7" id="uffbbf0f7">redirectTo</span></code></p></td><td data-lake-id="u487ec4a0" id="u487ec4a0"><p data-lake-id="u0eee319c" id="u0eee319c"><span data-lake-id="u99eb8813" id="u99eb8813">关闭当前页后跳转</span></p></td><td data-lake-id="u3f8883fb" id="u3f8883fb"><p data-lake-id="u9b2edfd8" id="u9b2edfd8"><span data-lake-id="uc49086b2" id="uc49086b2">❌</span></p></td></tr><tr data-lake-id="ufac0d757" id="ufac0d757"><td data-lake-id="u91a96146" id="u91a96146"><p data-lake-id="ud161fee7" id="ud161fee7"><code data-lake-id="ucc530e47" id="ucc530e47"><span data-lake-id="uf4716b28" id="uf4716b28">reLaunch</span></code></p></td><td data-lake-id="u61ee87d5" id="u61ee87d5"><p data-lake-id="uc1f6a9b1" id="uc1f6a9b1"><span data-lake-id="u5bbb8213" id="u5bbb8213">关闭所有页面后跳转</span></p></td><td data-lake-id="u5c7bfb30" id="u5c7bfb30"><p data-lake-id="u733c193f" id="u733c193f"><span data-lake-id="u7992d6e0" id="u7992d6e0">❌</span></p></td></tr><tr data-lake-id="uc2557ef3" id="uc2557ef3"><td data-lake-id="u9c1bbea3" id="u9c1bbea3"><p data-lake-id="u864ff62f" id="u864ff62f"><code data-lake-id="u7796a948" id="u7796a948"><span data-lake-id="u491444b5" id="u491444b5">switchTab</span></code></p></td><td data-lake-id="udd81a213" id="udd81a213"><p data-lake-id="u2004b5ac" id="u2004b5ac"><span data-lake-id="uf5240493" id="uf5240493">切换 </span><code data-lake-id="u1290c4d5" id="u1290c4d5"><span data-lake-id="ubde439e9" id="ubde439e9">tabBar</span></code><span data-lake-id="ud4e13998" id="ud4e13998">页面</span></p></td><td data-lake-id="ue490b75b" id="ue490b75b"><p data-lake-id="u93aafeb3" id="u93aafeb3"><span data-lake-id="u5fcbd13f" id="u5fcbd13f">❌</span></p></td></tr><tr data-lake-id="u463a93ac" id="u463a93ac"><td data-lake-id="ubec7ef56" id="ubec7ef56"><p data-lake-id="u13efeb00" id="u13efeb00"><code data-lake-id="u94dd467f" id="u94dd467f"><span data-lake-id="u5ce28c15" id="u5ce28c15">navigateBack</span></code></p></td><td data-lake-id="u66ba2f8e" id="u66ba2f8e"><p data-lake-id="uc9ed7fab" id="uc9ed7fab"><span data-lake-id="ub3c904f1" id="ub3c904f1">返回上一页或多级页面</span></p></td><td data-lake-id="uacae09e5" id="uacae09e5"><p data-lake-id="u07521fe6" id="u07521fe6"><span data-lake-id="u0ecfe71b" id="u0ecfe71b">✅</span></p></td></tr></tbody></table>

## 参数传递

```
uni.navigateTo({
  url: '/pages/detail/detail?id=123&name=Tom'
});

onLoad(options) {
  console.log(options.id);   // 123
  console.log(options.name); // Tom
}
```

```
const userInfo = {
  id: 123,
  name: 'Tom',
  age: 25
};
uni.navigateTo({
  url: `/pages/detail/detail?data=${encodeURIComponent(JSON.stringify(userInfo))}`
});

onLoad(options) {
  if (options.data) {
    const userInfo = JSON.parse(decodeURIComponent(options.data));
    console.log(userInfo); 
    // { id: 123, name: 'Tom', age: 25 }
  }
}
```
