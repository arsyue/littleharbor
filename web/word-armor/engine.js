const WORD_MS = 30000, DEFAULT_HP = 10, DAMAGE = 1;
const HP_TIERS = [5,10,20];
function healthTier(value=DEFAULT_HP){if(!HP_TIERS.includes(value))throw Error("请选择 5、10 或 20 点血量。");return value}
const PACKS = {
  valley: {name:"自然探索",raw:`river 河流
cloud 云朵
stone 石头
forest 森林
island 岛屿
ocean 海洋
flower 花朵
valley 山谷
leaf 叶子
mountain 高山
rainbow 彩虹
desert 沙漠
meadow 草地
thunder 雷声
breeze 微风
shadow 影子
sunlight 阳光
waterfall 瀑布
lake 湖泊
storm 暴风雨
field 田野
garden 花园
snow 雪
branch 树枝
seed 种子
root 树根
planet 行星
star 星星
shell 贝壳
beach 海滩`},
  life: {name:"日常生活",raw:`pencil 铅笔
window 窗户
bread 面包
clock 时钟
chair 椅子
bottle 瓶子
basket 篮子
kitchen 厨房
mirror 镜子
ticket 票
camera 相机
pocket 口袋
school 学校
train 火车
market 市场
dinner 晚餐
plate 盘子
spoon 勺子
sugar 糖
coffee 咖啡
pillow 枕头
blanket 毯子
book 书
letter 信件
street 街道
bridge 桥
shirt 衬衫
table 桌子
apple 苹果
orange 橙子`},
  core: {name:"中学核心",raw:`journey 旅行
protect 保护
achieve 实现
patient 有耐心的
culture 文化
choice 选择（名词）
improve 改善
compare 比较
reason 原因
effort 努力（名词）
advice 建议（不可数名词）
support 支持
discover 发现
prepare 准备
success 成功（名词）
habit 习惯
future 未来
weather 天气
balance 平衡
memory 记忆
honest 诚实的
describe 描述
courage 勇气
independent 独立的
purpose 目的
decide 决定（动词）
ancient 古代的
reduce 减少
connect 连接
invent 发明`},
  ielts: {name:"雅思进阶",raw:`habitat 栖息地
sustain 维持
diversity 多样性
allocate 分配
erosion 侵蚀
evidence 证据
conserve 保护并节约
impact 影响（名词）
adapt 适应
emission 排放物
incentive 激励因素
resource 资源
priority 优先事项
estimate 估计
policy 政策
urban 城市的
rural 乡村的
migration 迁移
density 密度
factor 因素
decline 下降
reliable 可靠的
strategy 策略
consume 消耗
species 物种
scarcity 稀缺
infrastructure 基础设施
resilient 有韧性的
evaluate 评估
interval 间隔`}
};
function norm(s){return String(s??"").normalize("NFKC").trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ")}
function parseDeck(raw) {
  const list=[], used=new Set();
  for(const [i,line] of String(raw).trim().split(/\r?\n/).entries()){
    if(!line.trim()) continue;
    const match=line.trim().match(/^([a-zA-Z][a-zA-Z'’ -]*?)(?:\s*[,，\t|｜：:]\s*|\s+)([^\x00-\x7F].*)$/u);
    if(!match) throw Error("第 "+(i+1)+" 行请按「英文 中文释义」填写。");
    const en=norm(match[1]), zh=match[2].trim();
    if(en.length>45||zh.length>32)throw Error("第 "+(i+1)+" 行太长，请缩短单词或释义。");
    if(!used.has(en)){used.add(en);list.push({en,zh})}
  }
  if(list.length<4||list.length>250)throw Error("每份词表需包含 4 至 250 个不同的英文词条。");
  return list;
}
function deck(spec){const p=PACKS[spec.id];if(spec.id!=="custom"&&!p) throw Error("请选择有效词表。");return {name:p?p.name:"自定义词表",words:parseDeck(p?p.raw:spec.raw)}}
function createGame(size,specs,now,maxHP=DEFAULT_HP){
  healthTier(maxHP);
  if(![1,2,3].includes(size)) throw Error("请选择有效人数。");
  const decks=specs.map(deck), tanks=[];
  for(let team=0;team<2;team++) for(let slot=0;slot<size;slot++){
    const index=(team===1&&specs[1].id===specs[0].id&&specs[0].id==="valley"?slot+3:slot)%decks[team].words.length;
    tanks.push({id:(team?"B":"A")+(slot+1),team,slot,hp:maxHP,index,turn:0,expires:now+WORD_MS,hits:0,misses:0});
  }
  const next=[0,1].map(team=>(tanks.filter(t=>t.team===team).at(-1).index+1)%decks[team].words.length);
  return {size,maxHP,damage:DAMAGE,decks,tanks,next,started:now,ended:0,winner:null,seq:0,events:[]};
}
function advance(g,t,now){
  const words=g.decks[t.team].words;
  const busy=new Set(g.tanks.filter(o=>o.team===t.team&&o.hp>0).map(o=>o.index));
  let i=g.next[t.team];while(busy.has(i))i=(i+1)%words.length;
  t.index=i;g.next[t.team]=(i+1)%words.length;t.turn++;t.expires=now+WORD_MS;
}
function tick(g,now){
  if(g.winner!==null)return false;
  let changed=false;for(const t of g.tanks){
    if(t.hp>0&&now>=t.expires){advance(g,t,now-(now-t.expires)%WORD_MS);changed=true}
  }
  return changed;
}
function hit(g,attacker,target,value,turn,now){
  const a=g.tanks.find(t=>t.id===attacker), b=g.tanks.find(t=>t.id===target);
  if(g.winner!==null||!a?.hp||!b?.hp||a.team===b.team)throw Error("当前目标无法攻击。");
  if(b.turn!==turn)throw Error("目标已换词，请按新提示拼写。");
  if(norm(value)!==g.decks[b.team].words[b.index].en){a.misses++;return false}
  const damage=g.damage??25;
  b.hp=Math.max(0,b.hp-damage);a.hits++;g.seq++;
  g.events.push({id:g.seq,from:a.id,to:b.id,damage,down:!b.hp,at:now});g.events=g.events.slice(-14);
  if(b.hp)advance(g,b,now);
  else if(!g.tanks.some(t=>t.team===b.team&&t.hp>0)){g.winner=a.team;g.ended=now}
  return true;
}
function visibleGame(g){
  return {size:g.size,maxHP:g.maxHP??100,damage:g.damage??25,started:g.started,ended:g.ended,winner:g.winner,seq:g.seq,events:g.events,tanks:g.tanks.map(({index,...t})=>{
    const w=g.decks[t.team].words[index];return {...t,zh:w.zh,initial:w.en[0].toUpperCase()};
  }),deckNames:g.decks.map(d=>d.name)};
}