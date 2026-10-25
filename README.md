# CYCLONE TFM Live 

CHAMPI台风公开路径查看器，复用既有CYCLONE网站。展示官方中心/风级/预警、UCAR外部模式路径、真实TabPFN研究预测，以及24h圆/椭圆Conformal对照。

本仓库仅包含网站、公开数据更新器与部署代码。

## 三个独立部分

|部分|运行方式|电脑关机后的行为|
|---|---|---|
|公开网页|GitHub Pages或其他静态托管|已部署页面仍能访问|
|官方资料与外部路径更新|GitHub Actions计划每30分钟检查|云任务启用后继续检查，可能延迟|
|本项目TabPFN预测|独立私有推理环境|推理停止则预测不再更新；保留原时间并显示过期|

外部模式不会被重命名为TabPFN；更新官方中心不会刷新旧模型的起报时间。未来强度来自外部模式实际字段，TabPFN当前只预测位置。海岸交点是几何估计，不是官方登陆判断或登陆概率。Conformal结果是依赖时间序列上的经验校准，不宣称无条件覆盖保证。仅科研展示，不替代官方预警。

## 本机运行

在仓库根目录：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
cyclone-live serve --site site --port 8766
# 浏览器打开 http://127.0.0.1:8766/
```

不要直接双击HTML；浏览器需要HTTP加载JSON和模块。关闭服务终端会停止本机链接，但不会停止已经部署的GitHub Pages。

## 公开部署到自己的GitHub

目标仓库：`Qiuhan99/cyclone-tfm-live`。这是配置目标，是否已经创建/上线以实际GitHub状态为准。

1. 将本目录内容提交至该公开仓库的`main`分支。
2. 仓库Settings → Pages → Build and deployment选择 **GitHub Actions**。
3. Actions中运行 **Refresh public data and deploy Pages**。首次运行需要允许`github-pages`环境部署；如果环境有保护规则，按仓库实际规则处理。
4. 成功后使用Actions部署返回的真实网址。通常项目站网址形如`https://Qiuhan99.github.io/cyclone-tfm-live/`；在成功前不要把它称为已上线地址。

工作流在push、手动启动和UTC每小时第7/37分钟运行。每次先恢复上次成功的数据状态，再检查公开源、验证发布包，最后部署。源失败会保留旧值及原时间，页面显示来源失败与过期；全部来源失败则不部署新版本。数据状态存放在独立`live-data`分支，只包含公开的operations JSON。

[GitHub Pages是静态托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，不会运行Python或TabPFN。[计划任务可能延迟，公开仓库60天无活动也可能自动停用](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。每30分钟是计划检查频率，不是官方资料生产频率，也不是严格实时SLA。

## 接入真实TabPFN更新

首版已带有真实历史缓存。公开仓库不包含私有模型和样本，不会仅靠`pip install`重新推理。

已有私有科研环境继续执行原`refresh_champi_operations.py --watch`，输出实际本地模型预测。用以下命令将完整operations JSON导入当前发布目录，保留每条模型原始起报和实际生成时间：

```bash
cyclone-live refresh --site site --tfm-payload /absolute/path/to/champi-operations.json
```

导入文件须来自可信的真实推理环境；入口校验来源摘要和issue/lead关系，不认证模型质量。部署生成的网站或将JSON提交到`live-data`分支的同名文件后，后续计划任务会保留这批TFM预测，直到收到更新。私有推理服务可以部署到常开服务器；该服务器和模型授权不属于此轻量仓库，不能把电脑停机时的旧预测写成新推理。

## 检查

```bash
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
python tools/check_public.py
```

`PUBLIC_EXPORT.json`记录从既有网站复制的明确文件清单及原始摘要，发布副本仅脱敏机器路径和调整公网文案。历史研究数字未改写。公开版研究说明在`site/assets/docs/`；完整科研复现材料保留本地。

当前数据适配器明确限定`WP292026 / CHAMPI`，没有自动识别全球所有活跃台风。多风暴配置是后续扩展，不伪造当前支持范围。
